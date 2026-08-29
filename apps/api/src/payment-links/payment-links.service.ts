import { Injectable } from "@nestjs/common";
import { PaymentLinkStatus } from "@prisma/client";
import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { parsePaisa, paisaToString } from "../common/money";
import { encodeCursor } from "../common/pagination";
import { CreatePaymentLinkDto } from "./payment-links.dto";

const tokenNano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

@Injectable()
export class PaymentLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerUserId: string, body: CreatePaymentLinkDto) {
    const publicToken = `pl_${tokenNano()}`;
    const amountPaisa = body.amountPaisa ? parsePaisa(body.amountPaisa) : null;
    const origin = process.env.USER_APP_ORIGIN ?? "http://localhost:3000";
    const url = `${origin}/pay/l/${publicToken}`;
    const row = await this.prisma.paymentLink.create({
      data: {
        publicToken,
        ownerUserId,
        amountPaisa,
        note: body.note,
      },
    });
    const qrPayload = await QRCode.toDataURL(url);
    return {
      publicToken: row.publicToken,
      url,
      qrPayload,
      amountPaisa: amountPaisa ? paisaToString(amountPaisa) : null,
      status: row.status,
    };
  }

  async list(ownerUserId: string, limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.paymentLink.findMany({
      where: {
        ownerUserId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const origin = process.env.USER_APP_ORIGIN ?? "http://localhost:3000";
    return {
      items: items.map((r) => ({
        publicToken: r.publicToken,
        url: `${origin}/pay/l/${r.publicToken}`,
        amountPaisa: r.amountPaisa ? paisaToString(r.amountPaisa) : null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async revoke(ownerUserId: string, publicToken: string) {
    const link = await this.prisma.paymentLink.findFirst({
      where: { publicToken, ownerUserId },
    });
    if (!link) throw new ApiError(Codes.LINK_NOT_FOUND, "Link not found", 404);
    await this.prisma.paymentLink.update({
      where: { id: link.id },
      data: { status: PaymentLinkStatus.REVOKED },
    });
    return { ok: true };
  }
}
