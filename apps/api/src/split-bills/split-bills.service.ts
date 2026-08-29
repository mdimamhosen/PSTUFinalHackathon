import { Injectable } from "@nestjs/common";
import {
  SplitBillStatus,
  SplitShareKind,
  SplitShareStatus,
  TransactionType,
} from "@prisma/client";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { publicUser, resolveRecipient } from "../common/identifiers";
import { parsePaisa, paisaToString } from "../common/money";
import { TransfersService } from "../transfers/transfers.service";
import { encodeCursor } from "../common/pagination";
import { CreateSplitBillDto } from "./split-bills.dto";

const refNano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

@Injectable()
export class SplitBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transfers: TransfersService,
  ) {}

  async create(creatorUserId: string, body: CreateSplitBillDto) {
    const total = parsePaisa(body.totalAmountPaisa);
    let sum = 0n;
    const resolved: { userId: string; amount: bigint; kind: SplitShareKind }[] = [];
    for (const share of body.shares) {
      const { user } = await resolveRecipient(this.prisma, share);
      const amount = parsePaisa(share.amountPaisa);
      sum += amount;
      resolved.push({
        userId: user.id,
        amount,
        kind: user.id === creatorUserId ? SplitShareKind.HOST : SplitShareKind.DEBTOR,
      });
    }
    if (sum !== total) {
      throw new ApiError(Codes.SHARES_SUM_MISMATCH, "Share amounts must equal the total");
    }
    const bill = await this.prisma.splitBill.create({
      data: {
        reference: `SPL-${refNano()}`,
        creatorUserId,
        title: body.title,
        totalAmountPaisa: total,
        shares: {
          create: resolved.map((s) => ({
            userId: s.userId,
            shareAmountPaisa: s.amount,
            kind: s.kind,
            status: s.kind === SplitShareKind.HOST ? SplitShareStatus.PAID : SplitShareStatus.PENDING,
          })),
        },
      },
      include: { shares: { include: { user: true, transaction: true } } },
    });
    return this.toDetail(bill);
  }

  async list(userId: string, limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.splitBill.findMany({
      where: {
        AND: [
          { OR: [{ creatorUserId: userId }, { shares: { some: { userId } } }] },
          ...(cursor
            ? [
                {
                  OR: [
                    { createdAt: { lt: cursor.createdAt } },
                    { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: { shares: { include: { user: true, transaction: true } } },
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items: items.map((b) => this.toDetail(b)),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async get(userId: string, id: string) {
    const bill = await this.prisma.splitBill.findFirst({
      where: {
        id,
        OR: [{ creatorUserId: userId }, { shares: { some: { userId } } }],
      },
      include: { shares: { include: { user: true, transaction: true } } },
    });
    if (!bill) throw new ApiError(Codes.SPLIT_NOT_FOUND, "Split bill not found", 404);
    return this.toDetail(bill);
  }

  async payShare(debtorUserId: string, billId: string, shareId: string, idempotencyKey: string) {
    return this.prisma.$transaction(async (db) => {
      const shareRows = await db.$queryRaw<
        {
          id: string;
          status: SplitShareStatus;
          user_id: string;
          share_amount_paisa: bigint;
          split_bill_id: string;
          creator_user_id: string;
          transaction_id: string | null;
        }[]
      >`
        SELECT s.id, s.status, s.user_id, s.share_amount_paisa, s.split_bill_id, b.creator_user_id, s.transaction_id
        FROM split_bill_shares s
        JOIN split_bills b ON b.id = s.split_bill_id
        WHERE s.id = ${shareId}::uuid AND s.split_bill_id = ${billId}::uuid
        FOR UPDATE
      `;
      const share = shareRows[0];
      if (!share) throw new ApiError(Codes.SHARE_NOT_PAYABLE, "Share not found", 404);
      if (share.user_id !== debtorUserId) {
        throw new ApiError(Codes.FORBIDDEN, "Only the debtor can pay this share", 403);
      }
      if (share.status === SplitShareStatus.PAID && share.transaction_id) {
        const tx = await db.transaction.findUnique({ where: { id: share.transaction_id } });
        if (tx) return this.transfers.toDto(tx);
      }
      if (share.status !== SplitShareStatus.PENDING) {
        throw new ApiError(Codes.SHARE_NOT_PAYABLE, "Share is not payable");
      }
      const tx = await this.transfers.executeTransfer({
        fromUserId: debtorUserId,
        toUserId: share.creator_user_id,
        amountPaisa: share.share_amount_paisa,
        idempotencyKey,
        type: TransactionType.SPLIT_PAYMENT,
        splitShareId: share.id,
        tx: db,
      });
      await db.splitBillShare.update({
        where: { id: share.id },
        data: { status: SplitShareStatus.PAID, transactionId: tx.id },
      });
      const pending = await db.splitBillShare.count({
        where: { splitBillId: share.split_bill_id, status: SplitShareStatus.PENDING },
      });
      if (pending === 0) {
        await db.splitBill.update({
          where: { id: share.split_bill_id },
          data: { status: SplitBillStatus.SETTLED },
        });
      }
      return tx;
    });
  }

  async declineShare(debtorUserId: string, billId: string, shareId: string) {
    return this.prisma.$transaction(async (db) => {
      const rows = await db.$queryRaw<{ id: string; status: SplitShareStatus; user_id: string }[]>`
        SELECT id, status, user_id FROM split_bill_shares
        WHERE id = ${shareId}::uuid AND split_bill_id = ${billId}::uuid FOR UPDATE
      `;
      const share = rows[0];
      if (!share) throw new ApiError(Codes.SHARE_NOT_PAYABLE, "Share not found", 404);
      if (share.user_id !== debtorUserId) throw new ApiError(Codes.FORBIDDEN, "Forbidden", 403);
      if (share.status !== SplitShareStatus.PENDING) {
        throw new ApiError(Codes.SHARE_NOT_PAYABLE, "Share is not pending");
      }
      await db.splitBillShare.update({
        where: { id: shareId },
        data: { status: SplitShareStatus.DECLINED },
      });
      return { ok: true };
    });
  }

  async cancel(creatorUserId: string, id: string) {
    const paid = await this.prisma.splitBillShare.count({
      where: {
        splitBillId: id,
        kind: SplitShareKind.DEBTOR,
        status: SplitShareStatus.PAID,
      },
    });
    if (paid > 0) {
      throw new ApiError(Codes.SPLIT_NOT_FOUND, "Cannot cancel after a debtor paid");
    }
    const bill = await this.prisma.splitBill.findFirst({
      where: { id, creatorUserId, status: SplitBillStatus.OPEN },
    });
    if (!bill) throw new ApiError(Codes.SPLIT_NOT_FOUND, "Split bill not found", 404);
    await this.prisma.splitBill.update({
      where: { id },
      data: { status: SplitBillStatus.CANCELLED },
    });
    return { ok: true };
  }

  private toDetail(
    bill: {
      id: string;
      reference: string;
      title: string;
      totalAmountPaisa: bigint;
      status: SplitBillStatus;
      createdAt: Date;
      shares: {
        id: string;
        shareAmountPaisa: bigint;
        kind: SplitShareKind;
        status: SplitShareStatus;
        user: { name: string; username: string; email: string; phone: string; accountNumber: string; status: import("@prisma/client").UserStatus };
        transaction: { reference: string } | null;
      }[];
    },
  ) {
    return {
      id: bill.id,
      reference: bill.reference,
      title: bill.title,
      totalAmountPaisa: paisaToString(bill.totalAmountPaisa),
      status: bill.status,
      shares: bill.shares.map((s) => ({
        id: s.id,
        amountPaisa: paisaToString(s.shareAmountPaisa),
        kind: s.kind,
        status: s.status,
        user: publicUser(s.user),
        reference: s.transaction?.reference ?? null,
      })),
      createdAt: bill.createdAt.toISOString(),
    };
  }
}
