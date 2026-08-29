import { Module } from "@nestjs/common";
import { SplitBillsService } from "./split-bills.service";
import { SplitBillsController } from "./split-bills.controller";
import { TransfersModule } from "../transfers/transfers.module";

@Module({
  imports: [TransfersModule],
  controllers: [SplitBillsController],
  providers: [SplitBillsService],
})
export class SplitBillsModule {}
