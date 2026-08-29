import { Prisma, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, Codes } from "../common/errors";

export type IdentifierBody = {
  toUsername?: string;
  toEmail?: string;
  toPhone?: string;
  toAccountNumber?: string;
  paymentLinkToken?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function countIdentifiers(body: IdentifierBody): number {
  return [
    body.toUsername,
    body.toEmail,
    body.toPhone,
    body.toAccountNumber,
    body.paymentLinkToken,
  ].filter((v) => v != null && String(v).trim() !== "").length;
}

export function assertXorIdentifier(body: IdentifierBody) {
  if (countIdentifiers(body) !== 1) {
    throw new ApiError(Codes.INVALID_RECIPIENT, "Provide exactly one recipient field");
  }
  for (const v of [
    body.toUsername,
    body.toEmail,
    body.toPhone,
    body.toAccountNumber,
    body.paymentLinkToken,
  ]) {
    if (v && UUID_RE.test(v.trim())) {
      throw new ApiError(Codes.INVALID_RECIPIENT, "Raw ids are not allowed");
    }
  }
}

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!/^01\d{9}$/.test(digits)) {
    throw new ApiError(Codes.INVALID_RECIPIENT, "Phone must be 01XXXXXXXXX");
  }
  return digits;
}

export async function resolveRecipient(
  prisma: PrismaService | Prisma.TransactionClient,
  body: IdentifierBody,
) {
  assertXorIdentifier(body);
  if (body.paymentLinkToken) {
    const link = await prisma.paymentLink.findUnique({
      where: { publicToken: body.paymentLinkToken.trim() },
      include: { owner: true },
    });
    if (!link) throw new ApiError(Codes.LINK_NOT_FOUND, "Payment link not found");
    if (link.status !== "ACTIVE") {
      throw new ApiError(Codes.LINK_REVOKED, "Payment link is not active");
    }
    return { user: link.owner, paymentLink: link };
  }
  const user = body.toUsername
    ? await prisma.user.findUnique({
        where: { normalizedUsername: normalizeUsername(body.toUsername) },
      })
    : body.toEmail
      ? await prisma.user.findUnique({
          where: { email: body.toEmail.trim().toLowerCase() },
        })
      : body.toPhone
        ? await prisma.user.findUnique({
            where: { phone: normalizePhone(body.toPhone) },
          })
        : await prisma.user.findUnique({
            where: { accountNumber: body.toAccountNumber!.trim().toUpperCase() },
          });
  if (!user) throw new ApiError(Codes.USER_NOT_FOUND, "Recipient not found");
  return { user, paymentLink: null };
}

export function publicUser(user: {
  name: string;
  username: string;
  email: string;
  phone: string;
  accountNumber: string;
  status: UserStatus;
}) {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    accountNumber: user.accountNumber,
  };
}
