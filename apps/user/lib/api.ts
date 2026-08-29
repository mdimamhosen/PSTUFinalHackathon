"use server";

import { cookies } from "next/headers";
import { mapApiError, type ApiResult } from "@relay/ui";

const API = process.env.NEST_API_URL ?? "http://localhost:3001/api/v1";
const COOKIE = "relay_token";

export async function setToken(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearToken() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { idempotencyKey?: string },
): Promise<ApiResult<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
  const { idempotencyKey: _, ...rest } = init ?? {};
  try {
    const res = await fetch(`${API}${path}`, { ...rest, headers, cache: "no-store" });
    const json = await res.json();
    if (!json.success) {
      return {
        ok: false,
        error: mapApiError(json.error?.code, json.error?.message),
        code: json.error?.code,
      };
    }
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Unable to reach Relay API. Is the backend running?" };
  }
}
