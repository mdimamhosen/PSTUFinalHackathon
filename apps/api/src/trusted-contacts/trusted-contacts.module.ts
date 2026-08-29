import { Module } from "@nestjs/common";
import { TrustedContactsService } from "./trusted-contacts.service";
import { TrustedContactsController } from "./trusted-contacts.controller";

@Module({
  controllers: [TrustedContactsController],
  providers: [TrustedContactsService],
})
export class TrustedContactsModule {}
