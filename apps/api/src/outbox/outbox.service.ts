import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type OutboxInput = {
  type: string;
  aggregateId: string;
  recipientUserId: string;
  payload: Prisma.InputJsonValue;
};

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(tx: Prisma.TransactionClient, input: OutboxInput) {
    await tx.outboxEvent.upsert({
      where: {
        type_aggregateId_recipientUserId: {
          type: input.type,
          aggregateId: input.aggregateId,
          recipientUserId: input.recipientUserId,
        },
      },
      create: {
        type: input.type,
        aggregateId: input.aggregateId,
        recipientUserId: input.recipientUserId,
        payload: input.payload,
      },
      update: {},
    });
  }

  async enqueueStandalone(input: OutboxInput) {
    await this.prisma.outboxEvent.upsert({
      where: {
        type_aggregateId_recipientUserId: {
          type: input.type,
          aggregateId: input.aggregateId,
          recipientUserId: input.recipientUserId,
        },
      },
      create: {
        type: input.type,
        aggregateId: input.aggregateId,
        recipientUserId: input.recipientUserId,
        payload: input.payload,
      },
      update: {},
    });
  }
}
