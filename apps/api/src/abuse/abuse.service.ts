import { Injectable, Logger } from "@nestjs/common";
import { AbuseDecision, AbuseEngine, AbuseSource, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ABUSE_THRESHOLDS, AbuseResult } from "./abuse.rules";

@Injectable()
export class AbuseService {
  private readonly log = new Logger(AbuseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assessRegister(userId: string, ip?: string | null) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sameIpCount = ip
      ? await this.prisma.user.count({
          where: { registrationIp: ip, createdAt: { gte: since } },
        })
      : 0;
    const result = await this.runClaudeOrRules({
      sameIpCount,
      source: "REGISTER",
    });
    await this.persist(userId, AbuseSource.REGISTER, { ip, sameIpCount }, result);
  }

  async assessOtp(userId: string, failures: number) {
    const result = await this.runClaudeOrRules({ otpFailures: failures, source: "OTP" });
    await this.persist(userId, AbuseSource.OTP, { otpFailures: failures }, result);
  }

  private async runClaudeOrRules(signals: Record<string, unknown>): Promise<AbuseResult> {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (key) {
      try {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: key, timeout: 2000 });
        const msg = await client.messages.create({
          model: "claude-3-5-haiku-latest",
          max_tokens: 256,
          messages: [
            {
              role: "user",
              content: `Return JSON only: {"score":0-100,"decision":"ALLOW|VERIFY|BLOCK|ADMIN_REVIEW","reasons":["..."]}. Signals: ${JSON.stringify(signals)}`,
            },
          ],
        });
        const text = msg.content.find((c) => c.type === "text")?.text ?? "";
        const parsed = JSON.parse(text) as AbuseResult;
        if (this.validDecision(parsed.decision)) {
          return { ...parsed, engine: "CLAUDE" };
        }
      } catch (err) {
        this.log.warn(`Claude fallback: ${String(err)}`);
      }
    }
    return this.rules(signals);
  }

  private rules(signals: Record<string, unknown>): AbuseResult {
    const reasons: string[] = [];
    let score = 10;
    let decision: AbuseResult["decision"] = "ALLOW";
    const sameIp = Number(signals.sameIpCount ?? 0);
    const otpFailures = Number(signals.otpFailures ?? 0);
    if (sameIp > ABUSE_THRESHOLDS.sameIpRegisters24hBlock) {
      decision = "BLOCK";
      score = 90;
      reasons.push("Too many registrations from the same IP");
    } else if (sameIp > ABUSE_THRESHOLDS.sameIpRegisters24hReview) {
      decision = "ADMIN_REVIEW";
      score = 70;
      reasons.push("Multiple registrations from the same IP");
    }
    if (otpFailures >= ABUSE_THRESHOLDS.otpFailuresVerify) {
      decision = decision === "BLOCK" ? "BLOCK" : "VERIFY";
      score = Math.max(score, 60);
      reasons.push("Repeated OTP failures");
    }
    if (!reasons.length) reasons.push("No abuse signals");
    return { score, decision, reasons, engine: "RULES" };
  }

  private validDecision(value: string): value is AbuseResult["decision"] {
    return ["ALLOW", "VERIFY", "BLOCK", "ADMIN_REVIEW"].includes(value);
  }

  private async persist(
    userId: string,
    source: AbuseSource,
    signals: Prisma.InputJsonValue,
    result: AbuseResult,
  ) {
    await this.prisma.$transaction([
      this.prisma.abuseAssessment.create({
        data: {
          userId,
          source,
          signals,
          score: result.score,
          decision: result.decision as AbuseDecision,
          engine: result.engine as AbuseEngine,
          reasons: result.reasons,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          abuseScore: result.score,
          abuseDecision: result.decision as AbuseDecision,
        },
      }),
    ]);
  }
}
