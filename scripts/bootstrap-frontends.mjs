import fs from "fs";
import path from "path";

const root = path.resolve(".");

function write(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

const files = {};

files["packages/ui/package.json"] = JSON.stringify({
  name: "@relay/ui",
  version: "0.0.0",
  private: true,
  main: "./src/index.ts",
  types: "./src/index.ts",
  exports: {
    ".": "./src/index.ts",
    "./globals.css": "./src/globals.css",
  },
  peerDependencies: { react: "^19", "react-dom": "^19" },
  devDependencies: { "@types/react": "^19", typescript: "^5.7.3" },
}, null, 2);

files["packages/ui/tsconfig.json"] = JSON.stringify({
  extends: "@relay/typescript-config/base.json",
  compilerOptions: { jsx: "react-jsx", outDir: "dist" },
  include: ["src"],
}, null, 2);

files["packages/ui/src/globals.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 220 20% 97%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 142 76% 36%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.75rem;
}

* { border-color: hsl(var(--border)); }
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
`;

files["packages/ui/src/lib/utils.ts"] = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

files["packages/ui/src/lib/money.ts"] = `export function formatPaisa(paisa: string | number): string {
  const n = typeof paisa === "string" ? Number(paisa) : paisa;
  if (!Number.isFinite(n)) return "৳0.00";
  const taka = n / 100;
  return "৳" + taka.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function takaToPaisa(taka: string): string {
  const cleaned = taka.replace(/[^0-9.]/g, "");
  if (!cleaned) return "0";
  const parts = cleaned.split(".");
  const whole = parts[0] ?? "0";
  const frac = (parts[1] ?? "00").padEnd(2, "0").slice(0, 2);
  return String(Number(whole) * 100 + Number(frac));
}

export function parseTakaInput(value: string): string {
  return takaToPaisa(value);
}
`;

files["packages/ui/src/lib/errors.ts"] = `const MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "You do not have enough balance for this payment.",
  USER_NOT_FOUND: "We could not find that user.",
  SELF_TRANSFER: "You cannot send money to yourself.",
  INVALID_AMOUNT: "Please enter a valid amount.",
  AMOUNT_MISMATCH: "Amount does not match the payment link.",
  INVALID_RECIPIENT: "Please enter a valid recipient.",
  LINK_NOT_FOUND: "Payment link not found.",
  LINK_REVOKED: "This payment link has been revoked.",
  IDEMPOTENCY_KEY_REQUIRED: "Please try again.",
  IDEMPOTENCY_CONFLICT: "This payment was already submitted with different details.",
  TRANSFER_NOT_ALLOWED: "Transfers are not allowed on your account right now.",
  WALLET_SUSPENDED: "Your wallet is suspended.",
  DAILY_LIMIT_EXCEEDED: "You have reached your daily send limit.",
  RISK_BLOCKED: "This transfer was blocked for your security.",
  ABUSE_BLOCKED: "Your account is blocked. Contact support.",
  ABUSE_REVIEW: "Your account is under review.",
  REQUEST_NOT_FOUND: "Money request not found.",
  REQUEST_NOT_PAYABLE: "This request can no longer be paid.",
  REQUEST_ALREADY_PROCESSED: "This request was already processed.",
  SHARES_SUM_MISMATCH: "Split shares must equal the total.",
  SPLIT_NOT_FOUND: "Split bill not found.",
  SHARE_NOT_PAYABLE: "This share cannot be paid.",
  UNAUTHORIZED: "Please sign in again.",
  FORBIDDEN: "You do not have permission to do that.",
  EMAIL_NOT_VERIFIED: "Please verify your email first.",
  INVALID_OTP: "Invalid verification code.",
  OTP_EXPIRED: "Code expired. Request a new one.",
  INVALID_PASSWORD: "Incorrect password.",
  ALREADY_TRUSTED: "Contact is already trusted.",
  CANNOT_TRUST_SELF: "You cannot trust yourself.",
  RATE_LIMITED: "Too many requests. Please wait.",
  SERVICE_UNAVAILABLE: "Something went wrong. Try again later.",
};

export function mapApiError(code?: string, message?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code];
  return message ?? "Something went wrong.";
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
`;

files["packages/ui/src/components/button.tsx"] = `'use client';
import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
  secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90",
  outline: "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]",
  ghost: "hover:bg-[hsl(var(--muted))]",
  destructive: "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-sm",
  lg: "h-12 rounded-lg px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ className, variant = "default", size = "default", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
`;

files["packages/ui/src/components/input.tsx"] = `'use client';
import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
`;

files["packages/ui/src/components/card.tsx"] = `import * as React from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
`;

files["packages/ui/src/components/badge.tsx"] = `import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "default" | "secondary" | "success" | "warning" | "destructive";

const variants: Record<Variant, string> = {
  default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-800",
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}
`;

files["packages/ui/src/components/skeleton.tsx"] = `import { cn } from "../lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-[hsl(var(--muted))]", className)} {...props} />;
}
`;

files["packages/ui/src/components/toast.tsx"] = `'use client';
import * as React from "react";
import { cn } from "../lib/utils";

type ToastItem = { id: string; message: string; variant?: "default" | "error" };

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  push: (message: string, variant?: "default" | "error") => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, variant: "default" | "error" = "default") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg px-4 py-3 text-sm shadow-lg",
              t.variant === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
`;

files["packages/ui/src/components/layout-shell.tsx"] = `'use client';
import * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";

export type NavItem = { href: string; label: string; icon?: string };

export function LayoutShell({
  title,
  nav,
  children,
  actions,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[hsl(var(--primary))]">{title}</h1>
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-white">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
              )}
            >
              <span className="text-base">{item.icon ?? "•"}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
`;

files["packages/ui/src/index.ts"] = `export * from "./components/button";
export * from "./components/input";
export * from "./components/card";
export * from "./components/badge";
export * from "./components/skeleton";
export * from "./components/toast";
export * from "./components/layout-shell";
export * from "./lib/money";
export * from "./lib/errors";
export * from "./lib/utils";
`;

const nextAppBase = (name, port, cookieName) => ({
  pkg: {
    name,
    version: "0.0.0",
    private: true,
    scripts: {
      dev: `next dev -p ${port}`,
      build: "next build",
      start: `next start -p ${port}`,
      lint: "next lint",
    },
    dependencies: {
      "@relay/ui": "*",
      next: "^15.2.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^2.6.0",
      qrcode: "^1.5.4",
    },
    devDependencies: {
      "@relay/typescript-config": "*",
      "@types/node": "^22.10.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@types/qrcode": "^1.5.5",
      autoprefixer: "^10.4.20",
      postcss: "^8.5.1",
      tailwindcss: "^3.4.17",
      typescript: "^5.7.3",
    },
  },
  cookieName,
  port,
});

const userApp = nextAppBase("@relay/user", 3000, "relay_token");
const adminApp = nextAppBase("@relay/admin", 3002, "relay_admin_token");

files["apps/user/package.json"] = JSON.stringify(userApp.pkg, null, 2);
files["apps/admin/package.json"] = JSON.stringify(adminApp.pkg, null, 2);

for (const app of ["user", "admin"]) {
  files[`apps/${app}/tsconfig.json`] = JSON.stringify({
    extends: "@relay/typescript-config/nextjs.json",
    compilerOptions: {
      paths: { "@/*": ["./*"], "@relay/ui": ["../../packages/ui/src/index.ts"] },
      plugins: [{ name: "next" }],
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2);

  files[`apps/${app}/next.config.ts`] = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@relay/ui"],
};

export default nextConfig;
`;

  files[`apps/${app}/postcss.config.mjs`] = `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`;

  files[`apps/${app}/tailwind.config.ts`] = `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: { extend: { borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" } } },
  plugins: [],
};
export default config;
`;

  files[`apps/${app}/next-env.d.ts`] = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;
}

files["apps/user/lib/api.ts"] = `'use server';

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
  if (token) headers.Authorization = \`Bearer \${token}\`;
  if (init?.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
  const { idempotencyKey: _, ...rest } = init ?? {};
  try {
    const res = await fetch(\`\${API}\${path}\`, { ...rest, headers, cache: "no-store" });
    const json = await res.json();
    if (!json.success) {
      return { ok: false, error: mapApiError(json.error?.code, json.error?.message), code: json.error?.code };
    }
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Unable to reach Relay API. Is the backend running?" };
  }
}
`;

files["apps/user/lib/actions.ts"] = `'use server';

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
  const res = await api<{ token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) });
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
  if (res.data.user.role !== "USER") return { ok: false as const, error: "Use the admin app for admin accounts." };
  await setToken(res.data.token);
  if (res.data.user.status === "PENDING_EMAIL" || res.data.user.status === "PENDING_PHONE") redirect("/verify");
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
  return api<{ user: Record<string, unknown>; wallet: { balancePaisa: string; currency: string } | null }>("/auth/me");
}

export async function searchUsersAction(q: string) {
  return api<{ items: Array<{ name: string; username: string; email: string; phone: string; accountNumber: string }> }>(
    \`/users/search?q=\${encodeURIComponent(q)}\`,
  );
}

export async function quoteTransferAction(body: Record<string, string>) {
  return api<{ quote: Record<string, string>; recipient: Record<string, string> }>("/transfers/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function confirmTransferAction(body: Record<string, string>) {
  return api("/transfers", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: randomUUID(),
  });
}

export async function listTransfersAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/transfers\${q}\`);
}

export async function getTransferAction(id: string) {
  return api(\`/transfers/\${id}\`);
}

export async function createMoneyRequestAction(body: { toUsername: string; amountPaisa: string; note?: string }) {
  return api("/money-requests", { method: "POST", body: JSON.stringify(body) });
}

export async function listMoneyRequestsAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/money-requests\${q}\`);
}

export async function payMoneyRequestAction(id: string) {
  return api(\`/money-requests/\${id}/pay\`, { method: "POST", body: "{}", idempotencyKey: randomUUID() });
}

export async function declineMoneyRequestAction(id: string) {
  return api(\`/money-requests/\${id}/decline\`, { method: "POST", body: "{}" });
}

export async function cancelMoneyRequestAction(id: string) {
  return api(\`/money-requests/\${id}/cancel\`, { method: "POST", body: "{}" });
}

export async function createPaymentLinkAction(body: { amountPaisa?: string; note?: string }) {
  return api("/payment-links", { method: "POST", body: JSON.stringify(body) });
}

export async function listPaymentLinksAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/payment-links\${q}\`);
}

export async function revokePaymentLinkAction(token: string) {
  return api(\`/payment-links/\${token}/revoke\`, { method: "POST", body: "{}" });
}

export async function resolvePayAction(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return api(\`/pay/resolve?\${q}\`);
}

export async function createSplitBillAction(body: unknown) {
  return api("/split-bills", { method: "POST", body: JSON.stringify(body) });
}

export async function listSplitBillsAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/split-bills\${q}\`);
}

export async function getSplitBillAction(id: string) {
  return api(\`/split-bills/\${id}\`);
}

export async function paySplitShareAction(billId: string, shareId: string) {
  return api(\`/split-bills/\${billId}/shares/\${shareId}/pay\`, { method: "POST", body: "{}", idempotencyKey: randomUUID() });
}

export async function declineSplitShareAction(billId: string, shareId: string) {
  return api(\`/split-bills/\${billId}/shares/\${shareId}/decline\`, { method: "POST", body: "{}" });
}

export async function cancelSplitBillAction(id: string) {
  return api(\`/split-bills/\${id}/cancel\`, { method: "POST", body: "{}" });
}

export async function listActivityAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/activity\${q}\`);
}

export async function listNotificationsAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/notifications\${q}\`);
}

export async function readNotificationAction(id: string) {
  return api(\`/notifications/\${id}/read\`, { method: "POST", body: "{}" });
}

export async function listTrustedContactsAction() {
  return api<Array<{ id: string; trusted: Record<string, string>; createdAt: string }>>("/trusted-contacts");
}

export async function addTrustedContactAction(username: string, password: string) {
  return api("/trusted-contacts", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function removeTrustedContactAction(id: string) {
  return api(\`/trusted-contacts/\${id}\`, { method: "DELETE" });
}

export async function listRewardsAction() {
  return api<Array<{ useCase: string; amountPaisa: string; sourceId: string; createdAt: string }>>("/rewards");
}
`;

files["apps/admin/lib/api.ts"] = `'use server';

import { cookies } from "next/headers";
import { mapApiError, type ApiResult } from "@relay/ui";

const API = process.env.NEST_API_URL ?? "http://localhost:3001/api/v1";
const COOKIE = "relay_admin_token";

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

export async function api<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = \`Bearer \${token}\`;
  try {
    const res = await fetch(\`\${API}\${path}\`, { ...init, headers, cache: "no-store" });
    const json = await res.json();
    if (!json.success) {
      return { ok: false, error: mapApiError(json.error?.code, json.error?.message), code: json.error?.code };
    }
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Unable to reach Relay API." };
  }
}
`;

files["apps/admin/lib/actions.ts"] = `'use server';

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
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/admin/users\${qs ? \`?\${qs}\` : ""}\`);
}

export async function suspendUserAction(id: string) {
  return api(\`/admin/users/\${id}/suspend\`, { method: "POST", body: "{}" });
}

export async function unsuspendUserAction(id: string) {
  return api(\`/admin/users/\${id}/unsuspend\`, { method: "POST", body: "{}" });
}

export async function listTransactionsAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/admin/transactions\${q}\`);
}

export async function listAuditLogsAction(cursor?: string) {
  const q = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : "";
  return api<{ items: unknown[]; nextCursor: string | null }>(\`/admin/audit-logs\${q}\`);
}

export async function getReconciliationAction() {
  return api<{ status: string; walletCount: number; mismatches: unknown[] }>("/admin/reconciliation");
}

export async function listAbuseAction(decision?: string) {
  const q = decision ? \`?decision=\${encodeURIComponent(decision)}\` : "";
  return api<unknown[]>(\`/admin/abuse\${q}\`);
}

export async function allowAbuseAction(id: string) {
  return api(\`/admin/users/\${id}/abuse-allow\`, { method: "POST", body: "{}" });
}
`;

for (const [rel, content] of Object.entries(files)) {
  write(rel, content);
}

console.log(`Wrote ${Object.keys(files).length} base files.`);
