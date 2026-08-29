import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailerService } from "../mailer/mailer.service";

@Injectable()
export class OutboxWorker implements OnModuleInit {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, 2000);
  }

  async tick() {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { processedAt: null },
      take: 20,
      orderBy: { createdAt: "asc" },
    });
    for (const row of rows) {
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: { id: row.id, processedAt: null },
        data: { processedAt: new Date() },
      });
      if (claimed.count === 0) continue;
      try {
        if (!row.recipientUserId) {
          await this.prisma.outboxEvent.update({
            where: { id: row.id },
            data: { processedAt: new Date() },
          });
          continue;
        }
        await this.mailer.dispatch(row.type, row.payload, row.recipientUserId);
        await this.prisma.notification.upsert({
          where: {
            userId_type_aggregateId: {
              userId: row.recipientUserId,
              type: row.type,
              aggregateId: row.aggregateId,
            },
          },
          create: {
            userId: row.recipientUserId,
            type: row.type,
            title: row.type,
            body: this.mailer.preview(row.type, row.payload),
            href: "/activity",
            aggregateId: row.aggregateId,
          },
          update: {},
        });
      } catch {
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { processedAt: null, attempts: { increment: 1 } },
        });
      }
    }
  }
}
