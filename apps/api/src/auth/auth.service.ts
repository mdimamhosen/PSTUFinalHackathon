import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AbuseDecision, Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { OPENING_BALANCE_PAISA, paisaToString } from "../common/money";
import { Inject } from "@nestjs/common";
import { REDIS } from "../redis/redis.module";
import Redis from "ioredis";
import { OutboxService } from "../outbox/outbox.service";
import { AbuseService } from "../abuse/abuse.service";
import { RewardsService } from "../rewards/rewards.service";

const accountNano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const otpNano = customAlphabet("0123456789", 6);

export type JwtPayload = { sub: string; role: UserRole };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly outbox: OutboxService,
    private readonly abuse: AbuseService,
    private readonly rewards: RewardsService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  accountNumber() {
    return `RLY-${accountNano().slice(0, 4)}-${accountNano().slice(0, 4)}`;
  }

  async hashOtp(code: string) {
    return bcrypt.hash(code, 10);
  }

  async register(input: {
    name: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    ip?: string;
  }) {
    const normalizedUsername = input.username.trim().replace(/^@/, "").toLowerCase();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.replace(/\D/g, "");
    if (!/^01\d{9}$/.test(phone)) {
      throw new ApiError(Codes.INVALID_RECIPIENT, "Phone must be 01XXXXXXXXX");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const treasury = await this.prisma.user.findFirst({
      where: { role: UserRole.SYSTEM, normalizedUsername: "relay" },
      include: { wallet: true },
    });
    if (!treasury?.wallet) {
      throw new ApiError(Codes.SERVICE_UNAVAILABLE, "Treasury is not seeded");
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          username: normalizedUsername,
          normalizedUsername,
          email,
          phone,
          passwordHash,
          accountNumber: this.accountNumber(),
          registrationIp: input.ip,
          role: UserRole.USER,
          status: UserStatus.PENDING_EMAIL,
        },
      });
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balancePaisa: OPENING_BALANCE_PAISA,
        },
      });
      await tx.wallet.update({
        where: { id: treasury.wallet!.id },
        data: { balancePaisa: { decrement: OPENING_BALANCE_PAISA } },
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: treasury.wallet!.id,
          type: "OPENING_BALANCE",
          direction: "DEBIT",
          amountPaisa: OPENING_BALANCE_PAISA,
          balanceAfterPaisa: treasury.wallet!.balancePaisa - OPENING_BALANCE_PAISA,
        },
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "OPENING_BALANCE",
          direction: "CREDIT",
          amountPaisa: OPENING_BALANCE_PAISA,
          balanceAfterPaisa: OPENING_BALANCE_PAISA,
        },
      });
      await this.outbox.enqueue(tx, {
        type: "REGISTER_WELCOME",
        aggregateId: user.id,
        recipientUserId: user.id,
        payload: { email: user.email, name: user.name },
      });
      return { user, wallet };
    });

    await this.issueEmailOtp(created.user.id, created.user.email);
    void this.abuse.assessRegister(created.user.id, input.ip);
    const token = await this.sign(created.user.id, created.user.role);
    return {
      token,
      user: this.safeUser(created.user),
      wallet: { balancePaisa: paisaToString(created.wallet.balancePaisa), currency: "BDT" },
    };
  }

  async login(emailOrUsername: string, password: string) {
    const key = emailOrUsername.trim().toLowerCase().replace(/^@/, "");
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: key }, { normalizedUsername: key }],
      },
    });
    if (!user) {
      throw new ApiError(Codes.UNAUTHORIZED, "Invalid credentials", 401);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.redis.incr(`risk:login_fail:${user.id}`);
      await this.redis.expire(`risk:login_fail:${user.id}`, 15 * 60);
      throw new ApiError(Codes.UNAUTHORIZED, "Invalid credentials", 401);
    }
    await this.redis.del(`risk:login_fail:${user.id}`);
    const token = await this.sign(user.id, user.role);
    return { token, user: this.safeUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw new ApiError(Codes.USER_NOT_FOUND, "User not found", 404);
    return {
      user: this.safeUser(user),
      wallet: user.wallet
        ? {
            balancePaisa: paisaToString(user.wallet.balancePaisa),
            currency: user.wallet.currency,
            status: user.wallet.status,
          }
        : null,
    };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await this.requireUser(userId);
    await this.checkOtp(userId, "email", code);
    if (user.status !== UserStatus.PENDING_EMAIL) {
      throw new ApiError(Codes.EMAIL_NOT_VERIFIED, "Email already verified");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), status: UserStatus.PENDING_PHONE },
    });
    await this.issuePhoneOtp(userId, user.phone);
    return { status: UserStatus.PENDING_PHONE };
  }

  async verifyPhone(userId: string, code: string) {
    const user = await this.requireUser(userId);
    if (!user.emailVerifiedAt) {
      throw new ApiError(Codes.EMAIL_NOT_VERIFIED, "Verify email first");
    }
    await this.checkOtp(userId, "phone", code);
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: new Date(), status: UserStatus.ACTIVE },
    });
    void this.rewards.grantVerifyComplete(userId);
    return { status: UserStatus.ACTIVE };
  }

  async resendOtp(userId: string) {
    const user = await this.requireUser(userId);
    if (user.status === UserStatus.PENDING_EMAIL) {
      await this.issueEmailOtp(userId, user.email);
      return { channel: "email" };
    }
    if (user.status === UserStatus.PENDING_PHONE) {
      await this.issuePhoneOtp(userId, user.phone);
      return { channel: "phone" };
    }
    throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Account already verified");
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.requireUser(userId);
    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) throw new ApiError(Codes.INVALID_PASSWORD, "Current password is wrong");
    const passwordHash = await bcrypt.hash(next, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    return { ok: true };
  }

  private async issueEmailOtp(userId: string, email: string) {
    const code = otpNano();
    const hash = await this.hashOtp(code);
    await this.redis.set(`otp:${userId}:email`, hash, "EX", 5 * 60);
    await this.outbox.enqueueStandalone({
      type: "OTP_EMAIL",
      aggregateId: `${userId}:email`,
      recipientUserId: userId,
      payload: { email, code },
    });
  }

  private async issuePhoneOtp(userId: string, phone: string) {
    const code = otpNano();
    const hash = await this.hashOtp(code);
    await this.redis.set(`otp:${userId}:phone`, hash, "EX", 5 * 60);
    await this.outbox.enqueueStandalone({
      type: "OTP_SMS",
      aggregateId: `${userId}:phone`,
      recipientUserId: userId,
      payload: { phone, code },
    });
  }

  private async checkOtp(userId: string, channel: "email" | "phone", code: string) {
    const key = `otp:${userId}:${channel}`;
    const hash = await this.redis.get(key);
    if (!hash) throw new ApiError(Codes.OTP_EXPIRED, "Code expired");
    const ok = await bcrypt.compare(code, hash);
    if (!ok) {
      await this.redis.incr(`otp:attempts:${userId}:${channel}`);
      throw new ApiError(Codes.INVALID_OTP, "Invalid code");
    }
    await this.redis.del(key);
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(Codes.USER_NOT_FOUND, "User not found", 404);
    return user;
  }

  private async sign(sub: string, role: UserRole) {
    return this.jwt.signAsync({ sub, role } satisfies JwtPayload);
  }

  safeUser(user: {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    accountNumber: string;
    role: UserRole;
    status: UserStatus;
    abuseDecision: AbuseDecision;
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
  }) {
    return {
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      accountNumber: user.accountNumber,
      role: user.role,
      status: user.status,
      abuseDecision: user.abuseDecision,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
    };
  }
}
