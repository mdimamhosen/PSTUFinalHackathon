import { Injectable } from "@nestjs/common";
import { TransactionType, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TransfersService } from "../transfers/transfers.service";
import { ApiError, Codes } from "../common/errors";
import { paisaToString } from "../common/money";

const CAPS = {
  SEND_CASHBACK: 2_000n,
  CASHBACK_RATE_BPS: 100n,
};

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transfers: TransfersService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.rewardGrant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({
      useCase: r.useCase,
      amountPaisa: paisaToString(r.amountPaisa),
      sourceId: r.sourceId,
      transactionId: r.transactionId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async grantVerifyComplete(userId: string) {
    await this.grant(userId, "VERIFY_COMPLETE", userId, 10_000n);
  }

  async grantFirstSend(userId: string, transactionId: string) {
    const prior = await this.prisma.transaction.count({
      where: {
        fromUserId: userId,
        status: "COMPLETED",
        type: TransactionType.TRANSFER,
        id: { not: transactionId },
      },
    });
    if (prior === 0) {
      await this.grant(userId, "FIRST_SEND", userId, 5_000n);
    }
  }

  async grantSendCashback(userId: string, transactionId: string, amountPaisa: bigint) {
    const raw = (amountPaisa * CAPS.CASHBACK_RATE_BPS) / 10_000n;
    const reward = raw > CAPS.SEND_CASHBACK ? CAPS.SEND_CASHBACK : raw;
    if (reward > 0n) {
      await this.grant(userId, "SEND_CASHBACK", transactionId, reward);
    }
  }

  async grantTrustedSend(userId: string, transactionId: string) {
    await this.grant(userId, "TRUSTED_SEND", transactionId, 500n);
  }

  async grantRequestPay(userId: string, requestId: string) {
    await this.grant(userId, "REQUEST_PAY", requestId, 1_000n);
  }

  private async grant(userId: string, useCase: string, sourceId: string, amountPaisa: bigint) {
    const existing = await this.prisma.rewardGrant.findUnique({
      where: { userId_useCase_sourceId: { userId, useCase, sourceId } },
    });
    if (existing) return;
    const treasury = await this.prisma.user.findFirst({
      where: { role: UserRole.SYSTEM, normalizedUsername: "relay" },
    });
    if (!treasury) return;
    const tx = await this.transfers.executeTransfer({
      fromUserId: treasury.id,
      toUserId: userId,
      amountPaisa,
      idempotencyKey: `reward:${useCase}:${sourceId}`,
      type: TransactionType.REWARD,
      skipRisk: true,
    });
    await this.prisma.rewardGrant.create({
      data: {
        userId,
        useCase,
        sourceId,
        amountPaisa,
        transactionId: tx.id,
      },
    });
  }
}
