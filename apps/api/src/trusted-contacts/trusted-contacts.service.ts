import { Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { normalizeUsername, publicUser } from "../common/identifiers";
import { AddTrustedContactDto } from "./trusted-contacts.dto";

@Injectable()
export class TrustedContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerUserId: string) {
    const rows = await this.prisma.trustedContact.findMany({
      where: { ownerUserId },
      include: { trusted: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      trusted: publicUser(r.trusted),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async add(ownerUserId: string, body: AddTrustedContactDto) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerUserId } });
    if (!owner || owner.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Owner must be active");
    }
    const ok = await bcrypt.compare(body.password, owner.passwordHash);
    if (!ok) throw new ApiError(Codes.INVALID_PASSWORD, "Password is wrong");
    const trusted = await this.prisma.user.findUnique({
      where: { normalizedUsername: normalizeUsername(body.username) },
    });
    if (!trusted) throw new ApiError(Codes.USER_NOT_FOUND, "User not found");
    if (trusted.id === ownerUserId) {
      throw new ApiError(Codes.CANNOT_TRUST_SELF, "Cannot trust yourself");
    }
    if (trusted.status === UserStatus.SUSPENDED) {
      throw new ApiError(Codes.WALLET_SUSPENDED, "User is suspended");
    }
    try {
      const row = await this.prisma.trustedContact.create({
        data: { ownerUserId, trustedUserId: trusted.id },
        include: { trusted: true },
      });
      return { id: row.id, trusted: publicUser(row.trusted) };
    } catch {
      throw new ApiError(Codes.ALREADY_TRUSTED, "Already trusted");
    }
  }

  async remove(ownerUserId: string, id: string) {
    const row = await this.prisma.trustedContact.findFirst({ where: { id, ownerUserId } });
    if (!row) throw new ApiError(Codes.USER_NOT_FOUND, "Contact not found", 404);
    await this.prisma.trustedContact.delete({ where: { id } });
    return { ok: true };
  }
}
