import { Injectable } from "@nestjs/common";
import {
  Prisma,
  TransactionStatus,
  TransactionType,
  UserStatus,
  WalletStatus,
} from "@prisma/client";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { formatTaka, parsePaisa, paisaToString } from "../common/money";
import { OutboxService } from "../outbox/outbox.service";
import { RiskService } from "../risk/risk.service";
import { IdentifierBody, publicUser, resolveRecipient } from "../common/identifiers";
import { encodeCursor } from "../common/pagination";
import { TransferConfirmDto, TransferQuoteDto } from "./transfers.dto";

const refNano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export type ExecuteInput = {
  fromUserId: string;
  toUserId: string;
  amountPaisa: bigint;
  idempotencyKey: string;
  type: TransactionType;
  description?: string;
  requestId?: string;
  splitShareId?: string;
  paymentLinkId?: string;
  quoteSnapshot?: Prisma.InputJsonValue;
  skipRisk?: boolean;
  tx?: Prisma.TransactionClient;
};

type LockedWallet = {
  id: string;
  user_id: string;
  balance_paisa: bigint;
  status: WalletStatus;
};

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskService,
    private readonly outbox: OutboxService,
  ) {}

  async quote(fromUserId: string, body: TransferQuoteDto) {
    const { user: recipient, paymentLink } = await resolveRecipient(this.prisma, body);
    if (recipient.id === fromUserId) {
      throw new ApiError(Codes.SELF_TRANSFER, "Cannot send to yourself");
    }
    if (recipient.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Recipient is not active");
    }
    const amountPaisa = this.resolveAmount(body.amountPaisa, paymentLink?.amountPaisa ?? null);
    if (amountPaisa <= 0n) {
      throw new ApiError(Codes.INVALID_AMOUNT, "Amount must be positive");
    }
    await this.risk.evaluate({ fromUserId, toUserId: recipient.id, amountPaisa });
    const snapshot = this.buildSnapshot(amountPaisa, recipient);
    return { quote: snapshot, recipient: publicUser(recipient) };
  }

  async confirm(fromUserId: string, body: TransferConfirmDto, idempotencyKey: string) {
    const { user: recipient, paymentLink } = await resolveRecipient(this.prisma, body);
    const amountPaisa = parsePaisa(body.amountPaisa);
    if (paymentLink?.amountPaisa != null && paymentLink.amountPaisa !== amountPaisa) {
      throw new ApiError(Codes.AMOUNT_MISMATCH, "Amount does not match the payment link");
    }
    const snapshot = this.buildSnapshot(amountPaisa, recipient);
    return this.executeTransfer({
      fromUserId,
      toUserId: recipient.id,
      amountPaisa,
      idempotencyKey,
      type: TransactionType.TRANSFER,
      description: body.description,
      paymentLinkId: paymentLink?.id,
      quoteSnapshot: snapshot,
    });
  }

  async listForUser(userId: string, limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.transaction.findMany({
      where: {
        AND: [
          { OR: [{ fromUserId: userId }, { toUserId: userId }] },
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
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items: items.map((row) => this.toDto(row)),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async receipt(userId: string, id: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        fromUser: true,
        toUser: true,
      },
    });
    if (!row) throw new ApiError(Codes.USER_NOT_FOUND, "Transfer not found", 404);
    if (row.fromUserId !== userId && row.toUserId !== userId) {
      throw new ApiError(Codes.FORBIDDEN, "Forbidden", 403);
    }
    return {
      ...this.toDto(row),
      from: publicUser(row.fromUser),
      to: publicUser(row.toUser),
    };
  }

  private resolveAmount(raw: string | undefined, linkAmount: bigint | null) {
    if (linkAmount != null) return linkAmount;
    if (!raw) throw new ApiError(Codes.INVALID_AMOUNT, "Amount is required");
    return parsePaisa(raw);
  }

  private buildSnapshot(
    amountPaisa: bigint,
    recipient: {
      name: string;
      username: string;
      email: string;
      phone: string;
      accountNumber: string;
    },
  ) {
    const formatted = formatTaka(amountPaisa);
    return {
      youSend: formatted,
      theyReceive: formatted,
      fee: formatTaka(0n),
      delivery: "Instant",
      recipient: publicUser({ ...recipient, status: UserStatus.ACTIVE }),
    };
  }

  async executeTransfer(input: ExecuteInput) {
    if (input.amountPaisa <= 0n) {
      throw new ApiError(Codes.INVALID_AMOUNT, "Amount must be positive");
    }
    if (input.fromUserId === input.toUserId) {
      throw new ApiError(Codes.SELF_TRANSFER, "Cannot send to yourself");
    }

    const reader = input.tx ?? this.prisma;
    const existing = await reader.transaction.findUnique({
      where: {
        fromUserId_idempotencyKey: {
          fromUserId: input.fromUserId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) {
      if (this.samePayload(existing, input) && existing.status === TransactionStatus.COMPLETED) {
        return this.toDto(existing);
      }
      throw new ApiError(
        Codes.IDEMPOTENCY_CONFLICT,
        "Idempotency key was reused with a different payload",
        409,
      );
    }

    if (!input.skipRisk) {
      await this.risk.evaluate({
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        amountPaisa: input.amountPaisa,
      });
    }

    const commit = async (db: Prisma.TransactionClient) => {
      try {
        const row = await this.run(db, input);
        return this.toDto(row);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          const again = await db.transaction.findUnique({
            where: {
              fromUserId_idempotencyKey: {
                fromUserId: input.fromUserId,
                idempotencyKey: input.idempotencyKey,
              },
            },
          });
          if (again && this.samePayload(again, input)) {
            return this.toDto(again);
          }
          throw new ApiError(Codes.IDEMPOTENCY_CONFLICT, "Idempotency key conflict", 409);
        }
        throw err;
      }
    };

    if (input.tx) {
      return commit(input.tx);
    }

    return this.prisma.$transaction(async (db) => commit(db));
  }

  private async run(db: Prisma.TransactionClient, input: ExecuteInput) {
    const wallets = await db.$queryRaw<LockedWallet[]>`
      SELECT id, user_id, balance_paisa, status
      FROM wallets
      WHERE user_id = ${input.fromUserId}::uuid OR user_id = ${input.toUserId}::uuid
      ORDER BY user_id
      FOR UPDATE
    `;
    if (wallets.length !== 2) {
      throw new ApiError(Codes.USER_NOT_FOUND, "Wallet missing");
    }
    const fromWallet = wallets.find((w) => w.user_id === input.fromUserId);
    const toWallet = wallets.find((w) => w.user_id === input.toUserId);
    if (!fromWallet || !toWallet) {
      throw new ApiError(Codes.USER_NOT_FOUND, "Wallet missing");
    }
    if (fromWallet.status !== WalletStatus.ACTIVE || toWallet.status !== WalletStatus.ACTIVE) {
      throw new ApiError(Codes.WALLET_SUSPENDED, "Wallet is not active");
    }

    const [fromUser, toUser] = await Promise.all([
      db.user.findUnique({ where: { id: input.fromUserId } }),
      db.user.findUnique({ where: { id: input.toUserId } }),
    ]);
    if (!fromUser || !toUser) throw new ApiError(Codes.USER_NOT_FOUND, "User not found");
    if (fromUser.status !== UserStatus.ACTIVE || toUser.status !== UserStatus.ACTIVE) {
      throw new ApiError(Codes.TRANSFER_NOT_ALLOWED, "Both accounts must be active");
    }
    if (fromWallet.balance_paisa < input.amountPaisa) {
      throw new ApiError(Codes.INSUFFICIENT_BALANCE, "Not enough balance");
    }

    const fromAfter = fromWallet.balance_paisa - input.amountPaisa;
    const toAfter = toWallet.balance_paisa + input.amountPaisa;
    const reference = `TXN-${refNano()}`;

    const row = await db.transaction.create({
      data: {
        reference,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        amountPaisa: input.amountPaisa,
        status: TransactionStatus.COMPLETED,
        type: input.type,
        idempotencyKey: input.idempotencyKey,
        description: input.description,
        requestId: input.requestId,
        splitShareId: input.splitShareId,
        paymentLinkId: input.paymentLinkId,
        quoteSnapshot: input.quoteSnapshot ?? Prisma.JsonNull,
      },
    });

    await db.wallet.update({
      where: { id: fromWallet.id },
      data: { balancePaisa: fromAfter },
    });
    await db.wallet.update({
      where: { id: toWallet.id },
      data: { balancePaisa: toAfter },
    });

    await db.ledgerEntry.createMany({
      data: [
        {
          transactionId: row.id,
          walletId: fromWallet.id,
          type: input.type === "CASHBACK" || input.type === "REWARD" ? "REWARD" : "TRANSFER",
          direction: "DEBIT",
          amountPaisa: input.amountPaisa,
          balanceAfterPaisa: fromAfter,
        },
        {
          transactionId: row.id,
          walletId: toWallet.id,
          type: input.type === "CASHBACK" || input.type === "REWARD" ? "REWARD" : "TRANSFER",
          direction: "CREDIT",
          amountPaisa: input.amountPaisa,
          balanceAfterPaisa: toAfter,
        },
      ],
    });

    await db.auditLog.create({
      data: {
        actorUserId: input.fromUserId,
        action: "TRANSFER_COMPLETED",
        entityType: "transaction",
        entityId: row.id,
        metadata: { reference, amountPaisa: paisaToString(input.amountPaisa) },
      },
    });

    await this.outbox.enqueue(db, {
      type: "TRANSFER_SENT",
      aggregateId: row.id,
      recipientUserId: input.fromUserId,
      payload: { reference, amountPaisa: paisaToString(input.amountPaisa) },
    });
    await this.outbox.enqueue(db, {
      type: "TRANSFER_RECEIVED",
      aggregateId: row.id,
      recipientUserId: input.toUserId,
      payload: { reference, amountPaisa: paisaToString(input.amountPaisa) },
    });

    return row;
  }

  private samePayload(
    row: {
      toUserId: string;
      amountPaisa: bigint;
      type: TransactionType;
      requestId: string | null;
      splitShareId: string | null;
    },
    input: ExecuteInput,
  ) {
    return (
      row.toUserId === input.toUserId &&
      row.amountPaisa === input.amountPaisa &&
      row.type === input.type &&
      (row.requestId ?? undefined) === input.requestId &&
      (row.splitShareId ?? undefined) === input.splitShareId
    );
  }

  toDto(row: {
    id: string;
    reference: string;
    fromUserId: string;
    toUserId: string;
    amountPaisa: bigint;
    status: TransactionStatus;
    type: TransactionType;
    quoteSnapshot: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      reference: row.reference,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      amountPaisa: paisaToString(row.amountPaisa),
      status: row.status,
      type: row.type,
      quoteSnapshot: row.quoteSnapshot,
      tracking: [
        { step: "Created", at: row.createdAt.toISOString() },
        {
          step:
            row.status === "COMPLETED"
              ? "Completed"
              : row.status === "FAILED"
                ? "Failed"
                : "Pending",
          at: row.updatedAt.toISOString(),
        },
      ],
      createdAt: row.createdAt.toISOString(),
    };
  }
}
