import { Module } from "@nestjs/common";
import { PayResolveController } from "./pay-resolve.controller";

@Module({
  controllers: [PayResolveController],
})
export class PayResolveModule {}
