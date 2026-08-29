import { Module } from "@nestjs/common";
import { MoneyRequestsService } from "./money-requests.service";
import { MoneyRequestsController } from "./money-requests.controller";
import { TransfersModule } from "../transfers/transfers.module";
import { RewardsModule } from "../rewards/rewards.module";

@Module({
  imports: [TransfersModule, RewardsModule],
  controllers: [MoneyRequestsController],
  providers: [MoneyRequestsService],
})
export class MoneyRequestsModule {}
