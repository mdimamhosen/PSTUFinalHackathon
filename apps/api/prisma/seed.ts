import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";

const accountNano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function accountNumber() {
  return `RLY-${accountNano().slice(0, 4)}-${accountNano().slice(0, 4)}`;
}

const prisma = new PrismaClient();

async function main() {
  const treasuryBalance = 1_000_000_000_000n;
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!";
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@relay.local";

  const treasury = await prisma.user.upsert({
    where: { normalizedUsername: "relay" },
    update: {},
    create: {
      name: "Relay Treasury",
      username: "relay",
      normalizedUsername: "relay",
      email: "treasury@relay.local",
      phone: "01999999999",
      passwordHash: await bcrypt.hash("no-login-treasury", 12),
      role: UserRole.SYSTEM,
      status: UserStatus.ACTIVE,
      accountNumber: accountNumber(),
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      wallet: {
        create: {
          balancePaisa: treasuryBalance,
        },
      },
    },
    include: { wallet: true },
  });

  if (!treasury.wallet) {
    await prisma.wallet.create({
      data: { userId: treasury.id, balancePaisa: treasuryBalance },
    });
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Relay Admin",
      username: "admin",
      normalizedUsername: "admin",
      email: adminEmail,
      phone: "01888888888",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accountNumber: accountNumber(),
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
