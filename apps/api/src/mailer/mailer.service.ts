import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Injectable()
export class MailerService {
  private readonly log = new Logger(MailerService.name);

  preview(type: string, payload: Prisma.JsonValue): string {
    if (typeof payload === "object" && payload) {
      if ("code" in payload)
        return `Your verification code is ${String((payload as { code?: string }).code)}`;
      if ("message" in payload) return String((payload as { message?: string }).message);
    }
    return type;
  }

  async dispatch(type: string, payload: Prisma.JsonValue, recipientUserId: string | null) {
    this.log.log(`mail ${type} -> ${recipientUserId}`);
    if (type === "OTP_SMS") {
      await this.sendSms(payload);
      return;
    }
    if (process.env.SMTP_HOST) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      const to = this.emailFromPayload(payload);
      if (to) {
        const code =
          typeof payload === "object" && payload && "code" in payload
            ? String((payload as { code?: string }).code)
            : null;
        await transport.sendMail({
          from: process.env.SMTP_FROM ?? "Relay <noreply@relay.local>",
          to,
          subject: code ? "Relay verification code" : `Relay: ${type}`,
          text: code
            ? `Your Relay verification code is ${code}. It expires in 5 minutes.`
            : JSON.stringify(payload),
        });
      }
    }
  }

  private async sendSms(payload: Prisma.JsonValue) {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
    if (!sid || !token || !from) {
      this.log.warn("Twilio not configured; skipping SMS");
      return;
    }
    if (typeof payload !== "object" || !payload || !("phone" in payload) || !("code" in payload)) {
      return;
    }
    const phone = String((payload as { phone?: string }).phone);
    const code = String((payload as { code?: string }).code);
    const to = phone.startsWith("+") ? phone : `+88${phone}`;
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    await client.messages.create({
      from,
      to,
      body: `Your Relay verification code is ${code}. It expires in 5 minutes.`,
    });
  }

  private emailFromPayload(payload: Prisma.JsonValue): string | null {
    if (typeof payload === "object" && payload && "email" in payload) {
      return String((payload as { email?: string }).email);
    }
    return null;
  }
}
