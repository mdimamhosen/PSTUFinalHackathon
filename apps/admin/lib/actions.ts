'use server';

import { redirect } from "next/navigation";
import { api, setToken, clearToken } from "./api";

export async function loginAction(formData: FormData) {
  const body = {
    emailOrUsername: String(formData.get("emailOrUsername") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const res = await api<{ token: string; user: { role: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return res;
  if (res.data.user.role !== "ADMIN") return { ok: false as const, error: "Admin access only." };
  await setToken(res.data.token);
  redirect("/users");
}

export async function logoutAction() {
  await clearToken();
  redirect("/login");
}

export async function listUsersAction(q?: string, cursor?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return api<{ items: unknown[]; nextCursor: string | null }>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export async function suspendUserAction(id: string) {
  return api(`/admin/users/${id}/suspend`, { method: "POST", body: "{}" });
}

export async function unsuspendUserAction(id: string) {
  return api(`/admin/users/${id}/unsuspend`, { method: "POST", body: "{}" });
}

export async function listTransactionsAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/admin/transactions${q}`);
}

export async function listAuditLogsAction(cursor?: string) {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(`/admin/audit-logs${q}`);
}

export async function getReconciliationAction() {
  return api<{ status: string; walletCount: number; mismatches: unknown[] }>("/admin/reconciliation");
}

export async function listAbuseAction(decision?: string) {
  const q = decision ? `?decision=${encodeURIComponent(decision)}` : "";
  return api<unknown[]>(`/admin/abuse${q}`);
}

export async function allowAbuseAction(id: string) {
  return api(`/admin/users/${id}/abuse-allow`, { method: "POST", body: "{}" });
}
