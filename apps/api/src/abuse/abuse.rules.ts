export type AbuseResult = {
  score: number;
  decision: "ALLOW" | "VERIFY" | "BLOCK" | "ADMIN_REVIEW";
  reasons: string[];
  engine: "CLAUDE" | "RULES";
};

export const ABUSE_THRESHOLDS = {
  sameIpRegisters24hReview: 3,
  sameIpRegisters24hBlock: 5,
  otpFailuresVerify: 10,
  earlySendAttemptsReview: 5,
};
