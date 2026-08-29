const fs = require("fs");
const { execSync } = require("child_process");

const dir = "apps/api/prisma/migrations/20250829120000_init";
fs.mkdirSync(dir, { recursive: true });
const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { cwd: "apps/api", encoding: "utf8" },
);
const checks = `
ALTER TABLE wallets ADD CONSTRAINT wallets_balance_nonneg CHECK (balance_paisa >= 0);
ALTER TABLE transactions ADD CONSTRAINT transactions_amount_positive CHECK (amount_paisa > 0);
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_amount_positive CHECK (amount_paisa > 0);
ALTER TABLE money_requests ADD CONSTRAINT money_requests_amount_positive CHECK (amount_paisa > 0);
ALTER TABLE reward_grants ADD CONSTRAINT reward_grants_amount_positive CHECK (amount_paisa > 0);
`;
fs.writeFileSync(`${dir}/migration.sql`, sql + checks, "utf8");
console.log("migration written");
