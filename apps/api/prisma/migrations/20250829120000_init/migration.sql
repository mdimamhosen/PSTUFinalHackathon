-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_EMAIL', 'PENDING_PHONE', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AbuseDecision" AS ENUM ('ALLOW', 'VERIFY', 'BLOCK', 'ADMIN_REVIEW');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TRANSFER', 'REQUEST_PAYMENT', 'SPLIT_PAYMENT', 'REVERSAL', 'REWARD', 'CASHBACK');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('OPENING_BALANCE', 'TRANSFER', 'REVERSAL', 'CORRECTION', 'REWARD', 'CASHBACK');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "MoneyRequestStatus" AS ENUM ('PENDING', 'PAID', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentLinkStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SplitBillStatus" AS ENUM ('OPEN', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitShareKind" AS ENUM ('HOST', 'DEBTOR');

-- CreateEnum
CREATE TYPE "SplitShareStatus" AS ENUM ('PENDING', 'PAID', 'DECLINED');

-- CreateEnum
CREATE TYPE "AbuseEngine" AS ENUM ('CLAUDE', 'RULES');

-- CreateEnum
CREATE TYPE "AbuseSource" AS ENUM ('REGISTER', 'OTP', 'EARLY_ACTIVITY');

-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('SCHEDULED', 'EXECUTED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "normalizedUsername" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_EMAIL',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "accountNumber" TEXT NOT NULL,
    "registrationIp" TEXT,
    "abuseDecision" "AbuseDecision" NOT NULL DEFAULT 'ALLOW',
    "abuseScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "balancePaisa" BIGINT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "amountPaisa" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TransactionType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "quoteSnapshot" JSONB,
    "requestId" TEXT,
    "splitShareId" TEXT,
    "paymentLinkId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "walletId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amountPaisa" BIGINT NOT NULL,
    "balanceAfterPaisa" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_requests" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "amountPaisa" BIGINT NOT NULL,
    "note" TEXT,
    "status" "MoneyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "amountPaisa" BIGINT,
    "note" TEXT,
    "status" "PaymentLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_bills" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmountPaisa" BIGINT NOT NULL,
    "status" "SplitBillStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_bill_shares" (
    "id" TEXT NOT NULL,
    "splitBillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareAmountPaisa" BIGINT NOT NULL,
    "kind" "SplitShareKind" NOT NULL,
    "status" "SplitShareStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,

    CONSTRAINT "split_bill_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "aggregateId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_transfers" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amountPaisa" BIGINT NOT NULL,
    "executeAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledStatus" NOT NULL DEFAULT 'SCHEDULED',
    "idempotencyKey" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_contacts" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "trustedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amountPaisa" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "AbuseSource" NOT NULL,
    "signals" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "decision" "AbuseDecision" NOT NULL,
    "engine" "AbuseEngine" NOT NULL,
    "reasons" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_normalizedUsername_key" ON "users"("normalizedUsername");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_accountNumber_key" ON "users"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_requestId_key" ON "transactions"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_splitShareId_key" ON "transactions"("splitShareId");

-- CreateIndex
CREATE INDEX "transactions_fromUserId_createdAt_idx" ON "transactions"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_fromUserId_toUserId_idx" ON "transactions"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_fromUserId_idempotencyKey_key" ON "transactions"("fromUserId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_createdAt_id_idx" ON "ledger_entries"("walletId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "money_requests_transactionId_key" ON "money_requests"("transactionId");

-- CreateIndex
CREATE INDEX "money_requests_payerUserId_status_idx" ON "money_requests"("payerUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_publicToken_key" ON "payment_links"("publicToken");

-- CreateIndex
CREATE INDEX "payment_links_ownerUserId_createdAt_idx" ON "payment_links"("ownerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "split_bills_reference_key" ON "split_bills"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "split_bill_shares_transactionId_key" ON "split_bill_shares"("transactionId");

-- CreateIndex
CREATE INDEX "split_bill_shares_userId_status_idx" ON "split_bill_shares"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "split_bill_shares_splitBillId_userId_key" ON "split_bill_shares"("splitBillId", "userId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_processedAt_createdAt_idx" ON "outbox_events"("processedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_type_aggregateId_recipientUserId_key" ON "outbox_events"("type", "aggregateId", "recipientUserId");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_type_aggregateId_key" ON "notifications"("userId", "type", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_transfers_publicRef_key" ON "scheduled_transfers"("publicRef");

-- CreateIndex
CREATE INDEX "scheduled_transfers_status_executeAt_idx" ON "scheduled_transfers"("status", "executeAt");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_transfers_fromUserId_idempotencyKey_key" ON "scheduled_transfers"("fromUserId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_contacts_ownerUserId_trustedUserId_key" ON "trusted_contacts"("ownerUserId", "trustedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_grants_userId_useCase_sourceId_key" ON "reward_grants"("userId", "useCase", "sourceId");

-- CreateIndex
CREATE INDEX "abuse_assessments_userId_createdAt_idx" ON "abuse_assessments"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "payment_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_requests" ADD CONSTRAINT "money_requests_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_requests" ADD CONSTRAINT "money_requests_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_requests" ADD CONSTRAINT "money_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bills" ADD CONSTRAINT "split_bills_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill_shares" ADD CONSTRAINT "split_bill_shares_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "split_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill_shares" ADD CONSTRAINT "split_bill_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill_shares" ADD CONSTRAINT "split_bill_shares_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transfers" ADD CONSTRAINT "scheduled_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transfers" ADD CONSTRAINT "scheduled_transfers_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_trustedUserId_fkey" FOREIGN KEY ("trustedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_assessments" ADD CONSTRAINT "abuse_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "wallets" ADD CONSTRAINT wallets_balance_nonneg CHECK ("balancePaisa" >= 0);
ALTER TABLE "transactions" ADD CONSTRAINT transactions_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT ledger_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "money_requests" ADD CONSTRAINT money_requests_amount_positive CHECK ("amountPaisa" > 0);
ALTER TABLE "reward_grants" ADD CONSTRAINT reward_grants_amount_positive CHECK ("amountPaisa" > 0);
