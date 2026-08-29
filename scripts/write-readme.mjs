import fs from "fs";
const content = `# Relay — Final Hackathon

Monorepo for the Relay closed-loop P2P digital wallet.

## Apps

- \`apps/api\` — NestJS backend API (\`http://localhost:3001/api/v1\`)
- \`apps/user\` — Next.js user wallet (\`http://localhost:3000\`)
- \`apps/admin\` — Next.js admin console (\`http://localhost:3002\`)
- \`packages/ui\` — Shared UI components, money formatting, error mapping

## Setup

### Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)

### 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment

Copy \`.env.example\` to \`apps/api/.env\`:

\`\`\`bash
cp .env.example apps/api/.env
\`\`\`

Key variables: \`DATABASE_URL\`, \`REDIS_URL\`, \`JWT_SECRET\`, \`USER_APP_ORIGIN\`, \`ADMIN_APP_ORIGIN\`.

### 3. Start database

\`\`\`bash
npm run db:up
npm run db:migrate
npm run db:seed
\`\`\`

Seed creates treasury + admin (\`admin@relay.local\` / \`Admin12345!\`).

### 4. Generate Prisma client

\`\`\`bash
npm run prisma:generate -w @relay/api
\`\`\`

### 5. Run everything

\`\`\`bash
npm run dev
\`\`\`

Or individually:

\`\`\`bash
npm run dev -w @relay/api
npm run dev -w @relay/user
npm run dev -w @relay/admin
\`\`\`

## Architecture

- Prisma only in \`apps/api\`
- Next.js Server Actions BFF — browser never calls Nest directly
- JWT in httpOnly cookies per origin
- Single money path via \`TransfersService.executeTransfer\`
- Money as paisa strings in JSON
- Recipient XOR fields on transfers
- Idempotency-Key on send/pay

## API docs

Swagger: \`http://localhost:3001/api/docs\`

## User flows

Register, verify email/phone OTP, dashboard, send, request, receive, split, activity, notifications, contacts, rewards.

OTP codes appear in Notifications after resend (and in API logs without SMTP).

## Admin flows

Users, transactions, audit logs, reconciliation, abuse queue.

## Build verification

\`\`\`bash
npm install
npm run prisma:generate -w @relay/api
npm run build -w @relay/api
npm run build -w @relay/user
npm run build -w @relay/admin
\`\`\`
`;
fs.writeFileSync("README.md", content, "utf8");
console.log("README written");
