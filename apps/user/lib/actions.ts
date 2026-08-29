"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { api, setToken, clearToken } from "./api";

export async function registerAction(formData: FormData) {
  const body = {
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const res = await api<{ token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return res;
  await setToken(res.data.token);
  redirect("/verify");
}

export async function loginAction(formData: FormData) {
  const body = {
    emailOrUsername: String(formData.get("emailOrUsername") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const res = await api<{ token: string; user: { status: string; role: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return res;
  if (res.data.user.role !== "USER")
    return { ok: false as const, error: "Use the admin app for admin accounts." };
  await setToken(res.data.token);
  if (res.data.user.status === "PENDING_EMAIL" || res.data.user.status === "PENDING_PHONE")
    redirect("/verify");
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearToken();
  redirect("/login");
}

export async function verifyEmailAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  return api("/auth/verify-email", { method: "POST", body: JSON.stringify({ code }) });
}

export async function verifyPhoneAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const res = await api("/auth/verify-phone", { method: "POST", body: JSON.stringify({ code }) });
  if (res.ok) redirect("/dashboard");
  return res;
}

export async function resendOtpAction() {
  return api("/auth/resend-otp", { method: "POST", body: "{}" });
}

export async function getMeAction() {
  return api<{
    user: Record<string, unknown>;
    wallet: { balancePaisa: string; currency: string } | null;
  }>("/auth/me");
}

export async function searchUsersAction(q: string) {
  return api<{
    items: Array<{
      name: string;
      username: string;
      email: string;
      phone: string;
      accountNumber: string;
    }>;
  }>(`/users/search?q=${encodeURIComponent(q)}`);
}

export async function quoteTransferAction(body: Record<string, string>) {
  return api<{ quote: Record<string, string>; recipient: Record<string, string> }>(
    "/transfers/quote",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function confirmTransferAction(body: Record<string, string>) {
  return api("/transfers", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: randomUUID(),
  });
}

export async function listTransfersAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/transfers${q}`);
}

export async function getTransferAction(id: string) {
  return api(`/transfers/${id}`);
}

export async function createMoneyRequestAction(body: {
  toUsername: string;
  amountPaisa: string;
  note?: string;
}) {
  return api("/money-requests", { method: "POST", body: JSON.stringify(body) });
}

export async function listMoneyRequestsAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/money-requests${q}`);
}

export async function payMoneyRequestAction(id: string) {
  return api(`/money-requests/${id}/pay`, {
    method: "POST",
    body: "{}",
    idempotencyKey: randomUUID(),
  });
}

export async function declineMoneyRequestAction(id: string) {
  return api(`/money-requests/${id}/decline`, { method: "POST", body: "{}" });
}

export async function cancelMoneyRequestAction(id: string) {
  return api(`/money-requests/${id}/cancel`, { method: "POST", body: "{}" });
}

export async function createPaymentLinkAction(body: { amountPaisa?: string; note?: string }) {
  return api("/payment-links", { method: "POST", body: JSON.stringify(body) });
}

export async function listPaymentLinksAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/payment-links${q}`);
}

export async function revokePaymentLinkAction(token: string) {
  return api(`/payment-links/${token}/revoke`, { method: "POST", body: "{}" });
}

export async function resolvePayAction(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return api(`/pay/resolve?${q}`);
}

export async function createSplitBillAction(body: unknown) {
  return api("/split-bills", { method: "POST", body: JSON.stringify(body) });
}

export async function listSplitBillsAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/split-bills${q}`);
}

export async function getSplitBillAction(id: string) {
  return api(`/split-bills/${id}`);
}

export async function paySplitShareAction(billId: string, shareId: string) {
  return api(`/split-bills/${billId}/shares/${shareId}/pay`, {
    method: "POST",
    body: "{}",
    idempotencyKey: randomUUID(),
  });
}

export async function declineSplitShareAction(billId: string, shareId: string) {
  return api(`/split-bills/${billId}/shares/${shareId}/decline`, { method: "POST", body: "{}" });
}

export async function cancelSplitBillAction(id: string) {
  return api(`/split-bills/${id}/cancel`, { method: "POST", body: "{}" });
}

export async function listActivityAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/activity${q}`);
}

export async function listNotificationsAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/notifications${q}`);
}

export async function readNotificationAction(id: string) {
  return api(`/notifications/${id}/read`, { method: "POST", body: "{}" });
}

export async function listTrustedContactsAction() {
  return api<Array<{ id: string; trusted: Record<string, string>; createdAt: string }>>(
    "/trusted-contacts",
  );
}

export async function addTrustedContactAction(username: string, password: string) {
  return api("/trusted-contacts", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function removeTrustedContactAction(id: string) {
  return api(`/trusted-contacts/${id}`, { method: "DELETE" });
}

export async function listRewardsAction() {
  return api<Array<{ useCase: string; amountPaisa: string; sourceId: string; createdAt: string }>>(
    "/rewards",
  );
}
