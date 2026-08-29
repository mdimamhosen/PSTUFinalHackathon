import { Global, Module } from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OutboxWorker } from "./outbox.worker";
import { MailerService } from "../mailer/mailer.service";

@Global()
@Module({
  providers: [OutboxService, OutboxWorker, MailerService],
  exports: [OutboxService, MailerService],
})
export class OutboxModule {}
