const fs = require("fs");
const content = `DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
REDIS_URL=redis://localhost:6379
JWT_SECRET=
JWT_EXPIRES_IN=7d
API_PORT=3001
ADMIN_EMAIL=admin@relay.local
ADMIN_PASSWORD=
USER_APP_ORIGIN=http://localhost:3000
ADMIN_APP_ORIGIN=http://localhost:3002
OPENING_BALANCE_PAISA=10000000

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Relay <noreply@relay.local>

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

ANTHROPIC_API_KEY=
CLAUDE_API_KEY=
OPENAI_API_KEY=
`;
fs.writeFileSync(".env.example", content, { encoding: "utf8" });
console.log("wrote .env.example", fs.readFileSync(".env.example")[1]);
