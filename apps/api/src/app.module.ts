import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { OutboxModule } from "./outbox/outbox.module";
import { RiskModule } from "./risk/risk.module";
import { TransfersModule } from "./transfers/transfers.module";
import { WalletModule } from "./wallet/wallet.module";
import { UsersModule } from "./users/users.module";
import { ActivityModule } from "./activity/activity.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MoneyRequestsModule } from "./money-requests/money-requests.module";
import { SplitBillsModule } from "./split-bills/split-bills.module";
import { PaymentLinksModule } from "./payment-links/payment-links.module";
import { TrustedContactsModule } from "./trusted-contacts/trusted-contacts.module";
import { RewardsModule } from "./rewards/rewards.module";
import { AbuseModule } from "./abuse/abuse.module";
import { AdminModule } from "./admin/admin.module";
import { PayResolveModule } from "./pay-resolve/pay-resolve.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    OutboxModule,
    HealthModule,
    AuthModule,
    AbuseModule,
    RiskModule,
    TransfersModule,
    WalletModule,
    UsersModule,
    ActivityModule,
    NotificationsModule,
    MoneyRequestsModule,
    SplitBillsModule,
    PaymentLinksModule,
    PayResolveModule,
    TrustedContactsModule,
    RewardsModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
