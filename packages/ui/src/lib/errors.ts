const MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "You do not have enough balance for this payment.",
  USER_NOT_FOUND: "We could not find that user.",
  SELF_TRANSFER: "You cannot send money to yourself.",
  INVALID_AMOUNT: "Please enter a valid amount.",
  AMOUNT_MISMATCH: "Amount does not match the payment link.",
  INVALID_RECIPIENT: "Please enter a valid recipient.",
  LINK_NOT_FOUND: "Payment link not found.",
  LINK_REVOKED: "This payment link has been revoked.",
  IDEMPOTENCY_KEY_REQUIRED: "Please try again.",
  IDEMPOTENCY_CONFLICT: "This payment was already submitted with different details.",
  TRANSFER_NOT_ALLOWED: "Transfers are not allowed on your account right now.",
  WALLET_SUSPENDED: "Your wallet is suspended.",
  DAILY_LIMIT_EXCEEDED: "You have reached your daily send limit.",
  RISK_BLOCKED: "This transfer was blocked for your security.",
  ABUSE_BLOCKED: "Your account is blocked. Contact support.",
  ABUSE_REVIEW: "Your account is under review.",
  REQUEST_NOT_FOUND: "Money request not found.",
  REQUEST_NOT_PAYABLE: "This request can no longer be paid.",
  REQUEST_ALREADY_PROCESSED: "This request was already processed.",
  SHARES_SUM_MISMATCH: "Split shares must equal the total.",
  SPLIT_NOT_FOUND: "Split bill not found.",
  SHARE_NOT_PAYABLE: "This share cannot be paid.",
  UNAUTHORIZED: "Please sign in again.",
  FORBIDDEN: "You do not have permission to do that.",
  EMAIL_NOT_VERIFIED: "Please verify your email first.",
  INVALID_OTP: "Invalid verification code.",
  OTP_EXPIRED: "Code expired. Request a new one.",
  INVALID_PASSWORD: "Incorrect password.",
  ALREADY_TRUSTED: "Contact is already trusted.",
  CANNOT_TRUST_SELF: "You cannot trust yourself.",
  RATE_LIMITED: "Too many requests. Please wait.",
  SERVICE_UNAVAILABLE: "Something went wrong. Try again later.",
};

export function mapApiError(code?: string, message?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return message ?? "Something went wrong.";
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
