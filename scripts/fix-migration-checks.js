const fs = require("fs");
const p = "apps/api/prisma/migrations/20250829120000_init/migration.sql";
let t = fs.readFileSync(p, "utf8");
const checks = `
ALTER TABLE "wallets" ADD CONSTRAINT wallets_balance_nonneg CHECK ("balancePaisa" >= 0);
ALTER TABLE "transactions" ADD CONSTRAINT transactions_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT ledger_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "money_requests" ADD CONSTRAINT money_requests_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "reward_grants" ADD CONSTRAINT reward_grants_amount_positive CHECK ("amountPaisa" > 0);
`;
t = t.replace(
  /\nALTER TABLE wallets ADD CONSTRAINT[\s\S]*$/,
  "\n" + checks.trim() + "\n",
);
fs.writeFileSync(p, t, { encoding: "utf8" });
console.log(t.split("\n").filter((l) => l.includes("CHECK")).join("\n"));
