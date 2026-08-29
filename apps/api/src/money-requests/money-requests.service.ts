import { Injectable } from "@nestjs/common";
import { MoneyRequestStatus, TransactionType, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";
import { normalizeUsername, publicUser } from "../common/identifiers";
import { parsePaisa, paisaToString } from "../common/money";
import { TransfersService } from "../transfers/transfers.service";
import { OutboxService } from "../outbox/outbox.service";
import { RewardsService } from "../rewards/rewards.service";
import { encodeCursor } from "../common/pagination";
import { CreateMoneyRequestDto } from "./money-requests.dto";

@Injectable()
export class MoneyRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transfers: TransfersService,
    private readonly outbox: OutboxService,
    private readonly rewards: RewardsService,
  ) {}

  async create(requesterUserId: string, body: CreateMoneyRequestDto) {
    const payer = await this.prisma.user.findUnique({
      where: { normalizedUsername: normalizeUsername(body.toUsername) },
    });
    if (!payer) throw new ApiError(Codes.USER_NOT_FOUND, "Payer not found");
    if (payer.id === requesterUserId) {
      throw new ApiError(Codes.SELF_TRANSFER, "Cannot request from yourself");
    }
    const amountPaisa = parsePaisa(body.amountPaisa);
    const row = await this.prisma.moneyRequest.create({
      data: {
        requesterUserId,
        payerUserId: payer.id,
        amountPaisa,
        note: body.note,
      },
    });
    await this.outbox.enqueueStandalone({
      type: "MONEY_REQUEST_CREATED",
      aggregateId: row.id,
      recipientUserId: payer.id,
      payload: { amountPaisa: paisaToString(amountPaisa) },
    });
    return this.toDto(row, payer);
  }

  async list(userId: string, limit: number, cursor: { createdAt: Date; id: string } | null) {
    const rows = await this.prisma.moneyRequest.findMany({
      where: {
        AND: [
          { OR: [{ requesterUserId: userId }, { payerUserId: userId }] },
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
      include: { requester: true, payer: true },
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items: items.map((r) => ({
        ...this.toDto(r, r.payer),
        requester: publicUser(r.requester),
        payer: publicUser(r.payer),
      })),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async pay(payerUserId: string, id: string, idempotencyKey: string) {
    return this.prisma.$transaction(async (db) => {
      const rows = await db.$queryRaw<
        { id: string; status: MoneyRequestStatus; requester_user_id: string; payer_user_id: string; amount_paisa: bigint; transaction_id: string | null }[]
      >`
        SELECT id, status, requester_user_id, payer_user_id, amount_paisa, transaction_id
        FROM money_requests WHERE id = ${id}::uuid FOR UPDATE
      `;
      const req = rows[0];
      if (!req) throw new ApiError(Codes.REQUEST_NOT_FOUND, "Request not found", 404);
      if (req.payer_user_id !== payerUserId) {
        throw new ApiError(Codes.FORBIDDEN, "Only the payer can pay", 403);
      }
      if (req.status === MoneyRequestStatus.PAID && req.transaction_id) {
        const tx = await db.transaction.findUnique({ where: { id: req.transaction_id } });
        if (tx) return this.transfers.toDto(tx);
        throw new ApiError(Codes.REQUEST_ALREADY_PROCESSED, "Already paid");
      }
      if (req.status !== MoneyRequestStatus.PENDING) {
        throw new ApiError(Codes.REQUEST_NOT_PAYABLE, "Request is not payable");
      }
      const tx = await this.transfers.executeTransfer({
        fromUserId: payerUserId,
        toUserId: req.requester_user_id,
        amountPaisa: req.amount_paisa,
        idempotencyKey,
        type: TransactionType.REQUEST_PAYMENT,
        requestId: req.id,
        tx: db,
      });
      await db.moneyRequest.update({
        where: { id: req.id },
        data: { status: MoneyRequestStatus.PAID, transactionId: tx.id },
      });
      await this.outbox.enqueue(db, {
        type: "MONEY_REQUEST_PAID",
        aggregateId: req.id,
        recipientUserId: req.requester_user_id,
        payload: { reference: tx.reference },
      });
      void this.rewards.grantRequestPay(payerUserId, req.id);
      return tx;
    });
  }

  async decline(payerUserId: string, id: string) {
    return this.prisma.$transaction(async (db) => {
      const rows = await db.$queryRaw<{ id: string; status: MoneyRequestStatus; payer_user_id: string }[]>`
        SELECT id, status, payer_user_id FROM money_requests WHERE id = ${id}::uuid FOR UPDATE
      `;
      const req = rows[0];
      if (!req) throw new ApiError(Codes.REQUEST_NOT_FOUND, "Request not found", 404);
      if (req.payer_user_id !== payerUserId) {
        throw new ApiError(Codes.FORBIDDEN, "Only the payer can decline", 403);
      }
      if (req.status !== MoneyRequestStatus.PENDING) {
        throw new ApiError(Codes.REQUEST_NOT_PAYABLE, "Request is not pending");
      }
      await db.moneyRequest.update({
        where: { id },
        data: { status: MoneyRequestStatus.DECLINED },
      });
      return { ok: true };
    });
  }

  async cancel(requesterUserId: string, id: string) {
    return this.prisma.$transaction(async (db) => {
      const rows = await db.$queryRaw<{ id: string; status: MoneyRequestStatus; requester_user_id: string }[]>`
        SELECT id, status, requester_user_id FROM money_requests WHERE id = ${id}::uuid FOR UPDATE
      `;
      const req = rows[0];
      if (!req) throw new ApiError(Codes.REQUEST_NOT_FOUND, "Request not found", 404);
      if (req.requester_user_id !== requesterUserId) {
        throw new ApiError(Codes.FORBIDDEN, "Only the requester can cancel", 403);
      }
      if (req.status !== MoneyRequestStatus.PENDING) {
        throw new ApiError(Codes.REQUEST_NOT_PAYABLE, "Request is not pending");
      }
      await db.moneyRequest.update({
        where: { id },
        data: { status: MoneyRequestStatus.CANCELLED },
      });
      return { ok: true };
    });
  }

  private toDto(
    row: { id: string; amountPaisa: bigint; status: MoneyRequestStatus; note: string | null; createdAt: Date },
    payer: { name: string; username: string; email: string; phone: string; accountNumber: string; status: UserStatus },
  ) {
    return {
      id: row.id,
      amountPaisa: paisaToString(row.amountPaisa),
      status: row.status,
      note: row.note,
      payer: publicUser(payer),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
