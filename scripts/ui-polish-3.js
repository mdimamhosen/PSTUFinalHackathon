const fs = require("fs");
const path = require("path");

function write(rel, content) {
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("wrote", rel);
}

write(
  "apps/user/app/layout.tsx",
  `import "@relay/ui/globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@relay/ui";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relay",
  description: "Closed-loop P2P wallet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${sans.variable} \${mono.variable}\`}>
      <body className="font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
`,
);

write(
  "apps/admin/app/layout.tsx",
  `import "@relay/ui/globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@relay/ui";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relay Admin",
  description: "Relay operations console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${sans.variable} \${mono.variable}\`}>
      <body className="font-sans theme-admin">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
`,
);

write(
  "apps/user/components/icons.tsx",
  `export function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
export function IconSend(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconRequest(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M19 12H7M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconReceive(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconMore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7ZM10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconSplit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M12 3v18M5 8h14M8 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
`,
);

write(
  "apps/user/components/app-shell.tsx",
  `"use client";
import Link from "next/link";
import { BrandMark, Button, LayoutShell } from "@relay/ui";
import { logoutAction } from "@/lib/actions";
import { IconBell, IconHome, IconMore, IconReceive, IconRequest, IconSend } from "./icons";

const nav = [
  { href: "/dashboard", label: "Home", icon: <IconHome />, match: "/dashboard" },
  { href: "/send", label: "Send", icon: <IconSend />, match: "/send" },
  { href: "/request", label: "Request", icon: <IconRequest />, match: "/request" },
  { href: "/receive", label: "Receive", icon: <IconReceive />, match: "/receive" },
  { href: "/activity", label: "More", icon: <IconMore />, match: "/activity" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell
      brand={<BrandMark />}
      nav={nav}
      actions={
        <>
          <Link
            href="/notifications"
            className="inline-flex size-10 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            aria-label="Notifications"
          >
            <IconBell />
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </>
      }
    >
      {children}
    </LayoutShell>
  );
}
`,
);

write(
  "apps/user/components/auth-form.tsx",
  `"use client";
import { useTransition } from "react";
import { Button, Field, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  title,
  description,
  action,
  fields,
  submitLabel,
  footer,
}: {
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string; autoComplete?: string }>;
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card className="animate-in shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(fd) =>
            start(async () => {
              const res = await action(fd);
              if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
            })
          }
        >
          {fields.map((f) => (
            <Field key={f.name} label={f.label} htmlFor={f.name}>
              <Input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                required
              />
            </Field>
          ))}
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {submitLabel}
          </Button>
        </form>
        {footer}
      </CardContent>
    </Card>
  );
}
`,
);

write(
  "apps/user/app/login/page.tsx",
  `import Link from "next/link";
import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Sign in to move money instantly with Relay
          </p>
        </div>
      </div>
      <AuthForm
        title="Sign in"
        description="Use your email or username"
        action={loginAction}
        submitLabel="Continue"
        fields={[
          {
            name: "emailOrUsername",
            label: "Email or username",
            placeholder: "you@example.com",
            autoComplete: "username",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
            New here?{" "}
            <Link href="/register" className="font-semibold text-[hsl(var(--primary))] hover:underline">
              Create account
            </Link>
          </p>
        }
      />
    </div>
  );
}
`,
);

write(
  "apps/user/app/(app)/dashboard/page.tsx",
  `import Link from "next/link";
import { getMeAction } from "@/lib/actions";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  EmptyState,
  formatPaisa,
  PageHeader,
} from "@relay/ui";
import { IconReceive, IconRequest, IconSend, IconSplit } from "@/components/icons";

export default async function DashboardPage() {
  const me = await getMeAction();
  if (!me.ok) {
    return (
      <Alert variant="error" title="Could not load wallet">
        {me.error}
      </Alert>
    );
  }
  const { user, wallet } = me.data;
  const actions = [
    { href: "/send", label: "Send", hint: "Pay anyone", icon: <IconSend /> },
    { href: "/request", label: "Request", hint: "Ask for money", icon: <IconRequest /> },
    { href: "/receive", label: "Receive", hint: "QR & links", icon: <IconReceive /> },
    { href: "/split", label: "Split", hint: "Share a bill", icon: <IconSplit /> },
  ];

  return (
    <div className="space-y-5 animate-in">
      <PageHeader
        title={\`Hi, \${String(user.name).split(" ")[0]}\`}
        description={\`@\${user.username as string}\`}
      />

      <section className="relative overflow-hidden rounded-3xl bg-[hsl(var(--primary))] px-5 py-6 text-[hsl(var(--primary-foreground))] shadow-soft">
        <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-6 size-36 rounded-full bg-black/10" />
        <p className="text-sm font-medium text-white/75">Available balance</p>
        <p className="mt-2 text-4xl font-bold tracking-tight tabular">
          {formatPaisa(wallet?.balancePaisa ?? "0")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/80">
          <span className="rounded-lg bg-white/15 px-2.5 py-1 font-mono">
            {String(user.accountNumber)}
          </span>
          <Badge
            variant={user.status === "ACTIVE" ? "success" : "warning"}
            className="bg-white/15 text-white ring-white/20"
          >
            {String(user.status)}
          </Badge>
        </div>
      </section>

      {user.status !== "ACTIVE" ? (
        <Alert variant="warning" title="Finish verification">
          Verify email and phone to send and receive money.{" "}
          <Link href="/verify" className="font-semibold underline">
            Continue verification
          </Link>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-2xl border border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--primary))] transition group-hover:scale-105">
              {a.icon}
            </span>
            <div className="font-semibold tracking-tight">{a.label}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{a.hint}</div>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-2 pt-5 text-center text-sm">
          <Link href="/activity" className="rounded-xl px-2 py-3 hover:bg-[hsl(var(--muted))]">
            Activity
          </Link>
          <Link href="/contacts" className="rounded-xl px-2 py-3 hover:bg-[hsl(var(--muted))]">
            Contacts
          </Link>
          <Link href="/rewards" className="rounded-xl px-2 py-3 hover:bg-[hsl(var(--muted))]">
            Rewards
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
`,
);

console.log("batch 3 done");
