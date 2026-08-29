import { Injectable } from "@nestjs/common";
import { AbuseDecision, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { paisaToString } from "../common/money";
import { decodeCursor, encodeCursor } from "../common/pagination";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    q: string | undefined,
    limit: number,
    cursor: { createdAt: Date; id: string } | null,
  ) {
    const term = (q ?? "").trim().toLowerCase();
    const rows = await this.prisma.user.findMany({
      where: term
        ? {
            OR: [
              { normalizedUsername: { contains: term } },
              { email: { contains: term } },
              { phone: { contains: term } },
            ],
          }
        : undefined,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor.id },
            skip: 1,
          }
        : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        status: u.status,
        abuseDecision: u.abuseDecision,
        createdAt: u.createdAt.toISOString(),
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async suspend(id: string) {
    await this.prisma.user.update({ where: { id }, data: { status: UserStatus.SUSPENDED } });
    return { ok: true };
  }

  async unsuspend(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(Codes.USER_NOT_FOUND, "User not found", 404);
    if (!user.emailVerifiedAt || !user.phoneVerifiedAt) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "User is not fully verified");
    }
    await this.prisma.user.update({ where: { id }, data: { status: UserStatus.ACTIVE } });
    return { ok: true };
  }

  async transactions(limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.transaction.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items: items.map((t) => ({
        id: t.id,
        reference: t.reference,
        amountPaisa: paisaToString(t.amountPaisa),
        status: t.status,
        type: t.type,
        createdAt: t.createdAt.toISOString(),
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async auditLogs(limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async reconciliation() {
    const wallets = await this.prisma.wallet.findMany({ include: { user: true } });
    const mismatches: {
      userId: string;
      username: string;
      balancePaisa: string;
      ledgerSum: string;
    }[] = [];
    for (const wallet of wallets) {
      const agg = await this.prisma.ledgerEntry.groupBy({
        by: ["direction"],
        where: { walletId: wallet.id },
        _sum: { amountPaisa: true },
      });
      const credits = agg.find((a) => a.direction === "CREDIT")?._sum.amountPaisa ?? 0n;
      const debits = agg.find((a) => a.direction === "DEBIT")?._sum.amountPaisa ?? 0n;
      const ledgerSum = credits - debits;
      if (ledgerSum !== wallet.balancePaisa) {
        mismatches.push({
          userId: wallet.userId,
          username: wallet.user.username,
          balancePaisa: paisaToString(wallet.balancePaisa),
          ledgerSum: paisaToString(ledgerSum),
        });
      }
    }
    return {
      status: mismatches.length ? "INTEGRITY_MISMATCH" : "BALANCED",
      walletCount: wallets.length,
      mismatches,
    };
  }

  async abuseQueue(decision: AbuseDecision | undefined, limit: number) {
    const rows = await this.prisma.abuseAssessment.findMany({
      where: decision
        ? { decision }
        : { decision: { in: [AbuseDecision.ADMIN_REVIEW, AbuseDecision.BLOCK] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: true },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.user.username,
      score: r.score,
      decision: r.decision,
      engine: r.engine,
      reasons: r.reasons,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async abuseAllow(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { abuseDecision: AbuseDecision.ALLOW, abuseScore: 0 },
    });
    return { ok: true };
  }
}
