import { Module } from "@nestjs/common";
import { RewardsService } from "./rewards.service";
import { RewardsController } from "./rewards.controller";
import { TransfersModule } from "../transfers/transfers.module";

@Module({
  imports: [TransfersModule],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
