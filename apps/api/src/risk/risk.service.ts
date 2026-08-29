import { Inject, Injectable } from "@nestjs/common";
import { AbuseDecision, TransactionType } from "@prisma/client";
import Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS } from "../redis/redis.module";
import { ApiError, Codes } from "../common/errors";
import {
  DAILY_SEND_CAP_PAISA,
  FAILED_LOGIN_THRESHOLD,
  NEW_RECIPIENT_LARGE_PAISA,
  PASSWORD_CHANGE_COOLDOWN_MS,
  VELOCITY_MAX,
  VELOCITY_WINDOW_MS,
  VERIFY_DAILY_CAP_PAISA,
} from "./risk.rules";

const COUNTED: TransactionType[] = [
  TransactionType.TRANSFER,
  TransactionType.REQUEST_PAYMENT,
  TransactionType.SPLIT_PAYMENT,
];

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async evaluate(input: { fromUserId: string; toUserId: string; amountPaisa: bigint }) {
    const from = await this.prisma.user.findUnique({ where: { id: input.fromUserId } });
    if (!from) throw new ApiError(Codes.USER_NOT_FOUND, "Sender not found");
    if (from.abuseDecision === AbuseDecision.BLOCK) {
      throw new ApiError(Codes.ABUSE_BLOCKED, "Account is blocked", 403);
    }
    if (from.abuseDecision === AbuseDecision.ADMIN_REVIEW) {
      throw new ApiError(Codes.ABUSE_REVIEW, "Account is under review", 403);
    }

    const fails = Number((await this.redis.get(`risk:login_fail:${input.fromUserId}`)) ?? 0);
    if (fails >= FAILED_LOGIN_THRESHOLD) {
      throw new ApiError(Codes.RISK_BLOCKED, "Too many failed logins", 403, "FAILED_LOGINS");
    }

    if (
      from.passwordChangedAt &&
      Date.now() - from.passwordChangedAt.getTime() < PASSWORD_CHANGE_COOLDOWN_MS
    ) {
      throw new ApiError(
        Codes.RISK_BLOCKED,
        "Password was changed recently. Try again later.",
        403,
        "PASSWORD_CHANGED",
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const daily = await this.prisma.transaction.aggregate({
      where: {
        fromUserId: input.fromUserId,
        status: "COMPLETED",
        type: { in: COUNTED },
        createdAt: { gte: startOfDay },
      },
      _sum: { amountPaisa: true },
    });
    const used = daily._sum.amountPaisa ?? 0n;
    const cap =
      from.abuseDecision === AbuseDecision.VERIFY ? VERIFY_DAILY_CAP_PAISA : DAILY_SEND_CAP_PAISA;
    if (used + input.amountPaisa > cap) {
      throw new ApiError(
        Codes.DAILY_LIMIT_EXCEEDED,
        "You have reached today's send limit",
        400,
        "DAILY_SEND",
      );
    }

    const velocitySince = new Date(Date.now() - VELOCITY_WINDOW_MS);
    const recent = await this.prisma.transaction.count({
      where: {
        fromUserId: input.fromUserId,
        status: "COMPLETED",
        type: { in: COUNTED },
        createdAt: { gte: velocitySince },
      },
    });
    if (recent >= VELOCITY_MAX) {
      throw new ApiError(Codes.RISK_BLOCKED, "Too many transfers in a short time", 403, "VELOCITY");
    }

    const prior = await this.prisma.transaction.findFirst({
      where: {
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        status: "COMPLETED",
        type: { in: COUNTED },
      },
    });
    if (!prior && input.amountPaisa > NEW_RECIPIENT_LARGE_PAISA) {
      throw new ApiError(
        Codes.RISK_BLOCKED,
        "Large first send to a new recipient is blocked",
        403,
        "NEW_RECIPIENT_LARGE",
      );
    }
  }
}
