const fs = require("fs");
const path = require("path");

function write(rel, content) {
  const p = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("wrote", rel);
}

write(
  "apps/user/app/register/page.tsx",
  `import Link from "next/link";
import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Open your wallet</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Instant opening balance of ৳100,000 — closed-loop BDT
          </p>
        </div>
      </div>
      <AuthForm
        title="Create account"
        description="We'll verify email, then phone"
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name", autoComplete: "name" },
          { name: "username", label: "Username", placeholder: "johndoe", autoComplete: "username" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "phone", label: "Phone", placeholder: "01XXXXXXXXX", autoComplete: "tel" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Have an account?{" "}
            <Link href="/login" className="font-semibold text-[hsl(var(--primary))] hover:underline">
              Sign in
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
  "apps/user/app/verify/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Alert,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@relay/ui";
import { useToast } from "@relay/ui";
import { getMeAction, verifyEmailAction, verifyPhoneAction, resendOtpAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const [status, setStatus] = useState<string>("PENDING_EMAIL");
  const [pending, start] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    void getMeAction().then((res) => {
      if (res.ok) {
        const s = res.data.user.status as string;
        setStatus(s);
        if (s === "ACTIVE") router.replace("/dashboard");
      }
    });
  }, [router]);

  const channel = status === "PENDING_PHONE" ? "phone" : "email";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex justify-center">
        <BrandMark />
      </div>
      <Card className="animate-in shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Verify your {channel}</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent. In local dev, check Notifications if SMTP/SMS is delayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info" title={channel === "email" ? "Step 1 of 2" : "Step 2 of 2"}>
            {channel === "email"
              ? "Confirm email first, then we will send a phone code."
              : "Almost done — verify phone to activate your wallet."}
          </Alert>
          <form
            className="space-y-4"
            action={(fd) =>
              start(async () => {
                const fn = status === "PENDING_PHONE" ? verifyPhoneAction : verifyEmailAction;
                const res = await fn(fd);
                if (!res.ok) return push(res.error, "error");
                push("Verified", "success");
                if (status === "PENDING_EMAIL") setStatus("PENDING_PHONE");
                else router.replace("/dashboard");
              })
            }
          >
            <Field label="Verification code" htmlFor="code">
              <Input
                id="code"
                name="code"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-lg tracking-[0.35em] font-mono"
                required
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={pending}>
              Verify {channel}
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await resendOtpAction();
                if (res.ok) {
                  const data = res.data as { channel: string };
                  push(\`Code resent via \${data.channel}\`, "success");
                } else push(res.error, "error");
              })
            }
          >
            Resend code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
`,
);

write(
  "apps/user/components/send-flow.tsx",
  `"use client";
import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  formatPaisa,
  parseTakaInput,
} from "@relay/ui";
import { useToast } from "@relay/ui";
import { searchUsersAction, quoteTransferAction, confirmTransferAction } from "@/lib/actions";
import Link from "next/link";

type Step = "search" | "amount" | "confirm" | "done";

function buildRecipientField(
  recipient: Record<string, string> | null,
  preset?: Record<string, string>,
): Record<string, string> {
  if (recipient?.username) return { toUsername: recipient.username };
  if (recipient?.accountNumber) return { toAccountNumber: recipient.accountNumber };
  if (preset?.paymentLinkToken) return { paymentLinkToken: preset.paymentLinkToken };
  return {};
}

export function SendFlow({ preset }: { preset?: Record<string, string> } = {}) {
  const [step, setStep] = useState<Step>(preset ? "amount" : "search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [searched, setSearched] = useState(false);
  const [recipient, setRecipient] = useState<Record<string, string> | null>(
    preset ? { username: preset.toUsername ?? "", ...preset } : null,
  );
  const [amount, setAmount] = useState(
    preset?.amountPaisa ? String(Number(preset.amountPaisa) / 100) : "",
  );
  const [quote, setQuote] = useState<Record<string, string> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [pending, start] = useTransition();
  const { push } = useToast();

  return (
    <div className="space-y-4 animate-in">
      <PageHeader
        title="Send money"
        description="Search, quote, then confirm — nothing moves until you confirm."
      />

      <div className="flex gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        {(["search", "amount", "confirm", "done"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={\`rounded-full px-2.5 py-1 \${
              step === s
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))]"
            }\`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Find recipient</CardTitle>
            <CardDescription>Username, email, or BD phone — never a UUID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Search" htmlFor="q">
              <Input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@karim or 01XXXXXXXXX"
              />
            </Field>
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await searchUsersAction(query);
                  setSearched(true);
                  if (!res.ok) return push(res.error, "error");
                  setResults(res.data.items as Array<Record<string, string>>);
                })
              }
            >
              Search
            </Button>
            <div className="space-y-2">
              {results.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  className="w-full rounded-xl border p-3 text-left transition hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--accent))]/50"
                  onClick={() => {
                    setRecipient(u);
                    setStep("amount");
                  }}
                >
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    @{u.username} · <span className="font-mono text-xs">{u.accountNumber}</span>
                  </div>
                </button>
              ))}
              {searched && !results.length ? (
                <EmptyState
                  title="No matches"
                  description="Try another username, email, or phone number."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "amount" && recipient && (
        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
            <CardDescription>
              To @{recipient.username || recipient.accountNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="You send (৳)" htmlFor="amount" hint="Enter taka, e.g. 2500.00">
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="text-lg tabular font-semibold"
              />
            </Field>
            <div className="flex gap-2">
              {!preset ? (
                <Button variant="outline" className="flex-1" onClick={() => setStep("search")}>
                  Back
                </Button>
              ) : null}
              <Button
                className="flex-1"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const body: Record<string, string> = {
                      ...buildRecipientField(recipient, preset),
                      amountPaisa: parseTakaInput(amount),
                    };
                    const res = await quoteTransferAction(body);
                    if (!res.ok) return push(res.error, "error");
                    setQuote(res.data.quote as Record<string, string>);
                    setRecipient(res.data.recipient as Record<string, string>);
                    setStep("confirm");
                  })
                }
              >
                Get quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && quote && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm payment</CardTitle>
            <CardDescription>Review the quote before money moves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-xl bg-[hsl(var(--muted))]/70 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">You send</span>
                <strong className="tabular">{quote.youSend}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">They receive</span>
                <strong className="tabular">{quote.theyReceive}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Fee</span>
                <span className="tabular">{quote.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Delivery</span>
                <span>{quote.delivery}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button
                className="flex-1"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const body: Record<string, string> = {
                      ...buildRecipientField(recipient, preset),
                      amountPaisa: parseTakaInput(amount),
                      description: "Relay transfer",
                    };
                    const res = await confirmTransferAction(body);
                    if (!res.ok) return push(res.error, "error");
                    setReceipt(res.data as Record<string, unknown>);
                    setStep("done");
                    push("Payment sent", "success");
                  })
                }
              >
                Confirm & pay
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && receipt && (
        <Card className="border-emerald-200/80">
          <CardHeader>
            <CardTitle>Payment sent</CardTitle>
            <CardDescription>Keep this TrxID for your records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success" title="Completed">
              Money moved through the Transfer Engine with double-entry ledger.
            </Alert>
            <div className="rounded-xl bg-[hsl(var(--muted))]/70 p-4 text-sm">
              <p className="text-[hsl(var(--muted-foreground))]">TrxID</p>
              <p className="mt-1 font-mono text-base font-semibold tracking-tight">
                {String(receipt.reference)}
              </p>
              <p className="mt-3 text-[hsl(var(--muted-foreground))]">Amount</p>
              <p className="mt-1 text-lg font-semibold tabular">
                {formatPaisa(String(receipt.amountPaisa))}
              </p>
            </div>
            <Link
              href={\`/send/receipt/\${receipt.id}\`}
              className="block text-center text-sm font-semibold text-[hsl(var(--primary))] hover:underline"
            >
              View full receipt
            </Link>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                setStep("search");
                setReceipt(null);
                setQuote(null);
                setAmount("");
                setRecipient(null);
                setSearched(false);
              }}
            >
              Send again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`,
);

write(
  "apps/user/app/(app)/activity/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  formatPaisa,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { listActivityAction } from "@/lib/actions";

export default function ActivityPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    start(async () => {
      const res = await listActivityAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Activity" description="Ledger history for your wallet" />
      <Card>
        <CardContent className="space-y-2 pt-5">
          {pending && !loaded ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {loaded && !items.length ? (
            <EmptyState
              title="No activity yet"
              description="Send or receive money to see ledger entries here."
              action={
                <Link
                  href="/send"
                  className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))]"
                >
                  Send money
                </Link>
              }
            />
          ) : null}
          {items.map((a) => {
            const credit = String(a.direction) === "CREDIT";
            return (
              <div
                key={String(a.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))]/70 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{String(a.type)}</span>
                    <Badge variant="outline">{String(a.direction)}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(String(a.createdAt)).toLocaleString()}
                    {a.reference ? \` · \${String(a.reference)}\` : ""}
                  </div>
                </div>
                <div
                  className={\`shrink-0 text-sm font-semibold tabular \${
                    credit ? "text-emerald-700" : "text-[hsl(var(--foreground))]"
                  }\`}
                >
                  {credit ? "+" : "−"}
                  {formatPaisa(String(a.amountPaisa))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/contacts"
          className="rounded-xl border bg-[hsl(var(--card))] p-3 text-center text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Trusted contacts
        </Link>
        <Link
          href="/rewards"
          className="rounded-xl border bg-[hsl(var(--card))] p-3 text-center text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Rewards
        </Link>
      </div>
    </div>
  );
}
`,
);

write(
  "apps/admin/app/(admin)/layout.tsx",
  `import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import { logoutAction } from "@/lib/actions";
import { AdminShell, Button } from "@relay/ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  if (!token) redirect("/login");
  const links = [
    { href: "/users", label: "Users" },
    { href: "/transactions", label: "Transactions" },
    { href: "/audit", label: "Audit" },
    { href: "/reconciliation", label: "Reconcile" },
    { href: "/abuse", label: "Abuse" },
  ];
  return (
    <AdminShell
      nav={links}
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
`,
);

write(
  "apps/admin/components/auth-form.tsx",
  `"use client";
import { useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  title,
  description,
  action,
  fields,
  submitLabel,
}: {
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string }>;
  submitLabel: string;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card className="animate-in shadow-sm">
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
                required
              />
            </Field>
          ))}
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
`,
);

write(
  "apps/admin/app/login/page.tsx",
  `import { BrandMark } from "@relay/ui";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="theme-admin mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-in">
        <BrandMark subtitle="Operations" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin console</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Users, reconciliation, and abuse review — no wallet send
          </p>
        </div>
      </div>
      <AuthForm
        title="Sign in"
        description="ADMIN role required"
        action={loginAction}
        submitLabel="Continue"
        fields={[
          { name: "emailOrUsername", label: "Email", placeholder: "admin@relay.local" },
          { name: "password", label: "Password", type: "password" },
        ]}
      />
    </div>
  );
}
`,
);

write(
  "apps/admin/app/(admin)/users/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { useToast } from "@relay/ui";
import { listUsersAction, suspendUserAction, unsuspendUserAction } from "@/lib/actions";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();

  const load = (query = q) =>
    start(async () => {
      const res = await listUsersAction(query || undefined);
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load("");
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Users" description="Search, suspend, and unsuspend accounts" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, username"
          className="sm:max-w-sm"
        />
        <Button onClick={() => load()} loading={pending}>
          Search
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-[hsl(var(--card))]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-[hsl(var(--muted))]/50 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Abuse</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((u) => (
                <tr key={String(u.id)} className="hover:bg-[hsl(var(--muted))]/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{String(u.name)}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      @{String(u.username)} · {String(u.email)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={String(u.status) === "ACTIVE" ? "success" : "warning"}>
                      {String(u.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{String(u.abuseDecision)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {String(u.status) !== "SUSPENDED" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          start(async () => {
                            await suspendUserAction(String(u.id));
                            push("User suspended", "success");
                            load();
                          })
                        }
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          start(async () => {
                            const res = await unsuspendUserAction(String(u.id));
                            if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
                            else {
                              push("User unsuspended", "success");
                              load();
                            }
                          })
                        }
                      >
                        Unsuspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pending && !loaded ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        {loaded && !items.length ? (
          <div className="p-4">
            <EmptyState title="No users found" description="Try a different search query." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
`,
);

write(
  "apps/admin/app/(admin)/reconciliation/page.tsx",
  `import { getReconciliationAction } from "@/lib/actions";
import { Alert, Badge, Card, CardContent, EmptyState, PageHeader } from "@relay/ui";

export default async function ReconciliationPage() {
  const res = await getReconciliationAction();
  if (!res.ok) {
    return (
      <Alert variant="error" title="Reconciliation failed">
        {res.error}
      </Alert>
    );
  }
  const d = res.data;
  const balanced = d.status === "BALANCED";
  return (
    <div className="space-y-4 animate-in">
      <PageHeader
        title="Reconciliation"
        description="Wallet balance vs ledger sum — read only"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Status
            </p>
            <div className="mt-2">
              <Badge variant={balanced ? "success" : "destructive"}>{d.status}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Wallets checked
            </p>
            <p className="mt-2 text-2xl font-bold tabular">{d.walletCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Mismatches
            </p>
            <p className="mt-2 text-2xl font-bold tabular">{d.mismatches.length}</p>
          </CardContent>
        </Card>
      </div>
      {balanced ? (
        <EmptyState
          title="All wallets balanced"
          description="Every wallet balance_paisa matches its ledger SUM."
        />
      ) : (
        <Alert variant="error" title="Integrity mismatch">
          Review mismatch rows carefully. Admins never patch balances directly.
        </Alert>
      )}
    </div>
  );
}
`,
);

write(
  "apps/admin/app/(admin)/abuse/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { useToast } from "@relay/ui";
import { listAbuseAction, allowAbuseAction } from "@/lib/actions";

export default function AbusePage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();

  const load = () =>
    start(async () => {
      const res = await listAbuseAction();
      if (res.ok) setItems(res.data as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader
        title="Abuse queue"
        description="ALLOW does not edit balances — movement only"
      />
      {pending && !loaded ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}
      <div className="space-y-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="flex flex-col gap-3 rounded-2xl border bg-[hsl(var(--card))] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-semibold">@{String(a.username ?? a.userId)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={String(a.decision) === "BLOCK" ? "destructive" : "warning"}>
                  {String(a.decision)}
                </Badge>
                <Badge variant="outline">{String(a.engine)}</Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Score {String(a.score)}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                start(async () => {
                  const uid = String(a.userId ?? "");
                  if (!uid) return;
                  await allowAbuseAction(uid);
                  push("User allowed", "success");
                  load();
                })
              }
            >
              Allow
            </Button>
          </div>
        ))}
      </div>
      {loaded && !items.length ? (
        <EmptyState title="Queue empty" description="No ADMIN_REVIEW or BLOCK assessments." />
      ) : null}
    </div>
  );
}
`,
);

console.log("batch 4 done");
