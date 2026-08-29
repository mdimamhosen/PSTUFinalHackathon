type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const USER_STATUS: Record<string, string> = {
  PENDING_EMAIL: "Email verification pending",
  PENDING_PHONE: "Phone verification pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

const ABUSE_DECISION: Record<string, string> = {
  ALLOW: "Allowed",
  VERIFY: "Needs verification",
  BLOCK: "Blocked",
  ADMIN_REVIEW: "Under admin review",
};

const TX_STATUS: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const WALLET_STATUS: Record<string, string> = {
  ACTIVE: "Active",
  FROZEN: "Frozen",
};

const MONEY_REQUEST_STATUS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const SPLIT_BILL_STATUS: Record<string, string> = {
  OPEN: "Open",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};

const SPLIT_SHARE_STATUS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  DECLINED: "Declined",
};

const PAYMENT_LINK_STATUS: Record<string, string> = {
  ACTIVE: "Active",
  REVOKED: "Revoked",
  EXPIRED: "Expired",
};

const LEDGER_DIRECTION: Record<string, string> = {
  CREDIT: "Credit",
  DEBIT: "Debit",
};

const RECON_STATUS: Record<string, string> = {
  BALANCED: "Balanced",
  INTEGRITY_MISMATCH: "Integrity mismatch",
};

const maps = [
  USER_STATUS,
  ABUSE_DECISION,
  TX_STATUS,
  WALLET_STATUS,
  MONEY_REQUEST_STATUS,
  SPLIT_BILL_STATUS,
  SPLIT_SHARE_STATUS,
  PAYMENT_LINK_STATUS,
  LEDGER_DIRECTION,
  RECON_STATUS,
];

export function humanizeLabel(value: unknown): string {
  const key = String(value ?? "");
  if (!key || key === "undefined" || key === "null") return "—";
  for (const map of maps) {
    if (map[key]) return map[key];
  }
  return key
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function statusBadgeVariant(value: unknown): BadgeVariant {
  const key = String(value ?? "");
  if (["ACTIVE", "COMPLETED", "PAID", "SETTLED", "ALLOW", "BALANCED", "CREDIT"].includes(key)) {
    return "success";
  }
  if (["BLOCK", "SUSPENDED", "FAILED", "DECLINED", "CANCELLED", "FROZEN", "INTEGRITY_MISMATCH"].includes(key)) {
    return "destructive";
  }
  if (["ADMIN_REVIEW", "VERIFY", "PENDING", "PENDING_EMAIL", "PENDING_PHONE", "OPEN", "WARNING"].includes(key)) {
    return "warning";
  }
  return "outline";
}
