import fs from "fs";
import path from "path";

const root = path.resolve(".");
function write(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

const userNav = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/send", label: "Send", icon: "↗" },
  { href: "/request", label: "Request", icon: "↙" },
  { href: "/receive", label: "Receive", icon: "📥" },
  { href: "/activity", label: "Activity", icon: "📋" },
];

const sharedLayout = (app) => `import "@relay/ui/globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@relay/ui";

export const metadata: Metadata = { title: "Relay", description: "P2P wallet" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
`;

write("apps/user/app/layout.tsx", sharedLayout("user"));
write("apps/admin/app/layout.tsx", sharedLayout("admin"));

write("apps/user/app/page.tsx", `import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";

export default async function Home() {
  const token = await getToken();
  redirect(token ? "/dashboard" : "/login");
}
`);

write("apps/admin/app/page.tsx", `import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";

export default async function Home() {
  const token = await getToken();
  redirect(token ? "/users" : "/login");
}
`);

write("apps/user/components/auth-form.tsx", `'use client';
import { useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  action,
  fields,
  submitLabel,
  footer,
}: {
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string }>;
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{submitLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          action={(fd) =>
            start(async () => {
              const res = await action(fd);
              if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
            })
          }
        >
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              <Input name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} required />
            </div>
          ))}
          <Button type="submit" className="w-full" loading={pending}>
            {submitLabel}
          </Button>
        </form>
        {footer}
      </CardContent>
    </Card>
  );
}
`);

write("apps/user/app/login/page.tsx", `import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">Relay</h1>
        <p className="text-sm text-slate-500">Sign in to your wallet</p>
      </div>
      <AuthForm
        action={loginAction}
        submitLabel="Sign in"
        fields={[
          { name: "emailOrUsername", label: "Email or username", placeholder: "you@example.com" },
          { name: "password", label: "Password", type: "password" },
        ]}
        footer={
          <p className="mt-4 text-center text-sm text-slate-500">
            New here? <Link href="/register" className="text-blue-600">Create account</Link>
          </p>
        }
      />
    </div>
  );
}
`);

write("apps/user/app/register/page.tsx", `import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">Relay</h1>
        <p className="text-sm text-slate-500">Create your wallet — ৳100,000 opening balance</p>
      </div>
      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name" },
          { name: "username", label: "Username", placeholder: "johndoe" },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", placeholder: "01XXXXXXXXX" },
          { name: "password", label: "Password", type: "password" },
        ]}
        footer={
          <p className="mt-4 text-center text-sm text-slate-500">
            Have an account? <Link href="/login" className="text-blue-600">Sign in</Link>
          </p>
        }
      />
    </div>
  );
}
`);

write("apps/user/app/verify/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@relay/ui";
import { useToast } from "@relay/ui";
import { getMeAction, verifyEmailAction, verifyPhoneAction, resendOtpAction } from "@/lib/actions";

export default function VerifyPage() {
  const [status, setStatus] = useState<string>("PENDING_EMAIL");
  const [pending, start] = useTransition();
  const { push } = useToast();

  useEffect(() => {
    void getMeAction().then((res) => {
      if (res.ok) setStatus(res.data.user.status as string);
    });
  }, []);

  const channel = status === "PENDING_PHONE" ? "phone" : "email";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>Verify your {channel}</CardTitle>
          <CardDescription>
            Check Notifications for your OTP code (also logged in API console). Resend if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={(fd) =>
              start(async () => {
                const fn = status === "PENDING_PHONE" ? verifyPhoneAction : verifyEmailAction;
                const res = await fn(fd);
                if (!res.ok) push(res.error, "error");
                else {
                  push("Verified!");
                  if (status === "PENDING_EMAIL") setStatus("PENDING_PHONE");
                }
              })
            }
          >
            <Input name="code" placeholder="6-digit code" maxLength={6} required className="mb-3" />
            <Button type="submit" className="w-full" loading={pending}>
              Verify
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              start(async () => {
                const res = await resendOtpAction();
                if (res.ok) push(\`OTP sent via \${res.data.channel}. Check Notifications.\`);
                else push(res.error, "error");
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
`);

write("apps/user/app/(app)/layout.tsx", `import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  if (!token) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
`);

write("apps/user/components/app-shell.tsx", `'use client';
import Link from "next/link";
import { LayoutShell } from "@relay/ui";
import { logoutAction } from "@/lib/actions";
import { Button } from "@relay/ui";

const nav = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/send", label: "Send", icon: "↗" },
  { href: "/request", label: "Request", icon: "↙" },
  { href: "/receive", label: "Receive", icon: "📥" },
  { href: "/activity", label: "More", icon: "⋯" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShell
      title="Relay"
      nav={nav}
      actions={
        <div className="flex gap-2">
          <Link href="/notifications" className="text-sm">🔔</Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">Out</Button>
          </form>
        </div>
      }
    >
      {children}
    </LayoutShell>
  );
}
`);

write("apps/user/app/(app)/dashboard/page.tsx", `import Link from "next/link";
import { getMeAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Badge } from "@relay/ui";

export default async function DashboardPage() {
  const me = await getMeAction();
  if (!me.ok) return <p className="text-red-600">{me.error}</p>;
  const { user, wallet } = me.data;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white/80 text-sm">Available balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatPaisa(wallet?.balancePaisa ?? "0")}</p>
          <p className="mt-1 text-sm text-white/70">@{user.username as string}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/send", label: "Send", icon: "↗" },
          { href: "/request", label: "Request", icon: "↙" },
          { href: "/receive", label: "Receive", icon: "📥" },
          { href: "/split", label: "Split", icon: "➗" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="rounded-xl border bg-white p-4 text-center shadow-sm hover:bg-slate-50">
            <div className="text-2xl">{a.icon}</div>
            <div className="font-medium">{a.label}</div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Status</span><Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>{String(user.status)}</Badge></div>
          <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-mono">{String(user.accountNumber)}</span></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <Link href="/contacts" className="rounded-lg border p-3 hover:bg-slate-50">Contacts</Link>
        <Link href="/rewards" className="rounded-lg border p-3 hover:bg-slate-50">Rewards</Link>
        <Link href="/notifications" className="rounded-lg border p-3 hover:bg-slate-50">Alerts</Link>
      </div>
    </div>
  );
}
`);

write("apps/user/components/send-flow.tsx", `'use client';
import { useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput } from "@relay/ui";
import { useToast } from "@relay/ui";
import { searchUsersAction, quoteTransferAction, confirmTransferAction } from "@/lib/actions";
import Link from "next/link";

type Step = "search" | "amount" | "confirm" | "done";

export function SendFlow({ preset?: Record<string, string> }) {
  const [step, setStep] = useState<Step>(preset ? "amount" : "search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [recipient, setRecipient] = useState<Record<string, string> | null>(preset ? { username: preset.toUsername ?? "", ...preset } : null);
  const [amount, setAmount] = useState(preset?.amountPaisa ? String(Number(preset.amountPaisa) / 100) : "");
  const [quote, setQuote] = useState<Record<string, string> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const recipientField = recipient?.username
    ? { toUsername: recipient.username }
    : recipient?.accountNumber
      ? { toAccountNumber: recipient.accountNumber }
      : preset?.paymentLinkToken
        ? { paymentLinkToken: preset.paymentLinkToken }
        : {};

  return (
    <div className="space-y-4">
      {step === "search" && (
        <Card>
          <CardHeader><CardTitle>Find recipient</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Username, email, or phone" />
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await searchUsersAction(query);
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
                  className="w-full rounded-lg border p-3 text-left hover:bg-slate-50"
                  onClick={() => {
                    setRecipient(u);
                    setStep("amount");
                  }}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-slate-500">@{u.username}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "amount" && recipient && (
        <Card>
          <CardHeader><CardTitle>Send to @{recipient.username || recipient.accountNumber}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in ৳" inputMode="decimal" />
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const body = { ...recipientField, amountPaisa: parseTakaInput(amount) };
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
          </CardContent>
        </Card>
      )}

      {step === "confirm" && quote && (
        <Card>
          <CardHeader><CardTitle>Confirm payment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>You send</span><strong>{quote.youSend}</strong></div>
            <div className="flex justify-between"><span>They receive</span><strong>{quote.theyReceive}</strong></div>
            <div className="flex justify-between"><span>Fee</span><span>{quote.fee}</span></div>
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const body = { ...recipientField, amountPaisa: parseTakaInput(amount), description: "Relay transfer" };
                  const res = await confirmTransferAction(body);
                  if (!res.ok) return push(res.error, "error");
                  setReceipt(res.data as Record<string, unknown>);
                  setStep("done");
                  push("Payment sent!");
                })
              }
            >
              Confirm & pay
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "done" && receipt && (
        <Card>
          <CardHeader><CardTitle>Receipt</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Reference: <strong>{String(receipt.reference)}</strong></p>
            <p>Amount: {formatPaisa(String(receipt.amountPaisa))}</p>
            <Link href={\`/send/receipt/\${receipt.id}\`} className="text-blue-600">View details</Link>
            <Button className="w-full mt-3" onClick={() => { setStep("search"); setReceipt(null); setQuote(null); }}>
              Send again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`);

write("apps/user/app/(app)/send/page.tsx", `import { SendFlow } from "@/components/send-flow";

export default function SendPage() {
  return <SendFlow />;
}
`);

write("apps/user/app/(app)/send/receipt/[id]/page.tsx", `import { getTransferAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Badge } from "@relay/ui";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTransferAction(id);
  if (!res.ok) return <p className="text-red-600">{res.error}</p>;
  const tx = res.data as Record<string, unknown>;
  return (
    <Card>
      <CardHeader><CardTitle>Transfer receipt</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Reference</span><span className="font-mono">{String(tx.reference)}</span></div>
        <div className="flex justify-between"><span>Amount</span><strong>{formatPaisa(String(tx.amountPaisa))}</strong></div>
        <div className="flex justify-between"><span>Status</span><Badge>{String(tx.status)}</Badge></div>
      </CardContent>
    </Card>
  );
}
`);

write("apps/user/components/request-panel.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import {
  createMoneyRequestAction,
  listMoneyRequestsAction,
  payMoneyRequestAction,
  declineMoneyRequestAction,
  cancelMoneyRequestAction,
  getMeAction,
} from "@/lib/actions";

export function RequestPanel() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = () =>
    start(async () => {
      const res = await listMoneyRequestsAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
    });

  useEffect(() => {
    load();
    void getMeAction().then((r) => r.ok && setMyUsername(String(r.data.user.username)));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Request money</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Payer username" />
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ৳" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await createMoneyRequestAction({ toUsername: username.replace(/^@/, ""), amountPaisa: parseTakaInput(amount), note: note || undefined });
                if (!res.ok) return push(res.error, "error");
                push("Request sent");
                setUsername(""); setAmount(""); setNote("");
                load();
              })
            }
          >
            Send request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => {
            const requester = item.requester as Record<string, string> | undefined;
            const payer = item.payer as Record<string, string>;
            const isPayer = payer?.username === myUsername;
            const isRequester = requester?.username === myUsername;
            return (
              <div key={String(item.id)} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{formatPaisa(String(item.amountPaisa))}</strong>
                  <Badge variant={String(item.status) === "PENDING" ? "warning" : "secondary"}>{String(item.status)}</Badge>
                </div>
                <p className="text-slate-500">{isPayer ? \`From @\${requester?.username}\` : \`To @\${payer?.username}\`}</p>
                {String(item.status) === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    {isPayer && (
                      <>
                        <Button size="sm" loading={pending} onClick={() => start(async () => { const r = await payMoneyRequestAction(String(item.id)); r.ok ? (push("Paid"), load()) : push(r.error, "error"); })}>Pay</Button>
                        <Button size="sm" variant="outline" onClick={() => start(async () => { await declineMoneyRequestAction(String(item.id)); load(); })}>Decline</Button>
                      </>
                    )}
                    {isRequester && (
                      <Button size="sm" variant="outline" onClick={() => start(async () => { await cancelMoneyRequestAction(String(item.id)); load(); })}>Cancel</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!items.length && <p className="text-slate-500">No requests yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
`);

write("apps/user/app/(app)/request/page.tsx", `import { RequestPanel } from "@/components/request-panel";
export default function RequestPage() { return <RequestPanel />; }
`);

write("apps/user/components/receive-panel.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput } from "@relay/ui";
import { useToast } from "@relay/ui";
import { getMeAction, createPaymentLinkAction, listPaymentLinksAction, revokePaymentLinkAction } from "@/lib/actions";
import QRCode from "qrcode";

export function ReceivePanel() {
  const [account, setAccount] = useState("");
  const [qr, setQr] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const loadLinks = () =>
    start(async () => {
      const res = await listPaymentLinksAction();
      if (res.ok) setLinks(res.data.items as Array<Record<string, unknown>>);
    });

  useEffect(() => {
    void getMeAction().then(async (r) => {
      if (!r.ok) return;
      const acct = String(r.data.user.accountNumber);
      setAccount(acct);
      setQr(await QRCode.toDataURL(acct, { margin: 1, width: 200 }));
    });
    loadLinks();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Your account QR</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          {qr ? <img src={qr} alt="Account QR" className="rounded-lg border" /> : null}
          <p className="font-mono text-sm">{account}</p>
          <p className="text-xs text-slate-500">Others can scan or enter this to pay you</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Create payment link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Fixed amount (optional)" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const body: { amountPaisa?: string; note?: string } = { note: note || undefined };
                if (amount) body.amountPaisa = parseTakaInput(amount);
                const res = await createPaymentLinkAction(body);
                if (!res.ok) return push(res.error, "error");
                push("Link created");
                setAmount(""); setNote("");
                loadLinks();
              })
            }
          >
            Create link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your links</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {links.map((l) => (
            <div key={String(l.publicToken)} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{l.amountPaisa ? formatPaisa(String(l.amountPaisa)) : "Any amount"}</div>
              <a href={String(l.url)} className="break-all text-blue-600">{String(l.url)}</a>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(String(l.url))}>Copy</Button>
                {String(l.status) === "ACTIVE" && (
                  <Button size="sm" variant="destructive" onClick={() => start(async () => { await revokePaymentLinkAction(String(l.publicToken)); loadLinks(); })}>Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
`);

write("apps/user/app/(app)/receive/page.tsx", `import { ReceivePanel } from "@/components/receive-panel";
export default function ReceivePage() { return <ReceivePanel />; }
`);

write("apps/user/app/pay/l/[token]/page.tsx", `import { resolvePayAction } from "@/lib/actions";
import { redirect } from "next/navigation";
import { SendFlow } from "@/components/send-flow";

export default async function PayLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await resolvePayAction({ paymentLinkToken: token });
  if (!res.ok) return <div className="p-8 text-center text-red-600">{res.error}</div>;
  const preset: Record<string, string> = { paymentLinkToken: token };
  if (res.data.amountPaisa) preset.amountPaisa = String(res.data.amountPaisa);
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">Pay via link</h1>
      <SendFlow preset={preset} />
    </div>
  );
}
`);

write("apps/user/components/split-panel.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { createSplitBillAction, listSplitBillsAction, paySplitShareAction, declineSplitShareAction, cancelSplitBillAction, getMeAction } from "@/lib/actions";

export function SplitPanel() {
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [debtors, setDebtors] = useState("");
  const [perShare, setPerShare] = useState("");
  const [bills, setBills] = useState<Array<Record<string, unknown>>>([]);
  const [myUsername, setMyUsername] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listSplitBillsAction();
    if (res.ok) setBills(res.data.items as Array<Record<string, unknown>>);
  });

  useEffect(() => {
    load();
    void getMeAction().then((r) => r.ok && setMyUsername(String(r.data.user.username)));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Split a bill</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title e.g. Dinner" />
          <Input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total ৳" />
          <Input value={debtors} onChange={(e) => setDebtors(e.target.value)} placeholder="Debtor usernames (comma separated)" />
          <Input value={perShare} onChange={(e) => setPerShare(e.target.value)} placeholder="Each share ৳" />
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const usernames = debtors.split(",").map((s) => s.trim()).filter(Boolean);
                const shareAmt = parseTakaInput(perShare);
                const shares = usernames.map((u) => ({ toUsername: u.replace(/^@/, ""), amountPaisa: shareAmt }));
                const hostShare = { toUsername: myUsername, amountPaisa: String(Number(parseTakaInput(total)) - shares.length * Number(shareAmt)) };
                const res = await createSplitBillAction({ title, totalAmountPaisa: parseTakaInput(total), shares: [...shares, hostShare] });
                if (!res.ok) return push(res.error, "error");
                push("Split created");
                setTitle(""); setTotal(""); setDebtors(""); setPerShare("");
                load();
              })
            }
          >
            Create split
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your splits</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {bills.map((bill) => {
            const shares = (bill.shares as Array<Record<string, unknown>>) ?? [];
            return (
              <div key={String(bill.id)} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{String(bill.title)}</strong>
                  <Badge>{String(bill.status)}</Badge>
                </div>
                <p>{formatPaisa(String(bill.totalAmountPaisa))}</p>
                {shares.map((s) => {
                  const user = s.user as Record<string, string>;
                  const mine = user.username === myUsername;
                  return (
                    <div key={String(s.id)} className="mt-2 flex items-center justify-between rounded bg-slate-50 p-2">
                      <span>@{user.username} — {formatPaisa(String(s.amountPaisa))}</span>
                      {mine && String(s.status) === "PENDING" && String(s.kind) === "DEBTOR" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => start(async () => { const r = await paySplitShareAction(String(bill.id), String(s.id)); r.ok ? (push("Paid"), load()) : push(r.error, "error"); })}>Pay</Button>
                          <Button size="sm" variant="outline" onClick={() => start(async () => { await declineSplitShareAction(String(bill.id), String(s.id)); load(); })}>Decline</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {String(bill.status) === "OPEN" && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => start(async () => { await cancelSplitBillAction(String(bill.id)); load(); })}>Cancel bill</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
`);

write("apps/user/app/(app)/split/page.tsx", `import { SplitPanel } from "@/components/split-panel";
export default function SplitPage() { return <SplitPanel />; }
`);

write("apps/user/app/(app)/activity/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Skeleton } from "@relay/ui";
import { listActivityAction } from "@/lib/actions";

export default function ActivityPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      const res = await listActivityAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pending && !items.length ? <Skeleton className="h-16 w-full" /> : null}
          {items.map((a) => (
            <div key={String(a.id)} className="flex justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">{String(a.type)}</div>
                <div className="text-slate-500">{new Date(String(a.createdAt)).toLocaleString()}</div>
              </div>
              <div className={String(a.direction) === "OUT" ? "text-red-600" : "text-emerald-600"}>
                {String(a.direction) === "OUT" ? "-" : "+"}{formatPaisa(String(a.amountPaisa))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/contacts" className="rounded-lg border p-3 text-center text-sm">Trusted contacts</Link>
        <Link href="/rewards" className="rounded-lg border p-3 text-center text-sm">Rewards</Link>
      </div>
    </div>
  );
}
`);

write("apps/user/app/(app)/notifications/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@relay/ui";
import { listNotificationsAction, readNotificationAction } from "@/lib/actions";

export default function NotificationsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [, start] = useTransition();

  const load = () => start(async () => {
    const res = await listNotificationsAction();
    if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
  });

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((n) => (
          <div key={String(n.id)} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{String(n.title)}</div>
            <div className="text-slate-600">{String(n.body)}</div>
            {!n.readAt && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => start(async () => { await readNotificationAction(String(n.id)); load(); })}>
                Mark read
              </Button>
            )}
          </div>
        ))}
        {!items.length && <p className="text-slate-500">No notifications.</p>}
      </CardContent>
    </Card>
  );
}
`);

write("apps/user/app/(app)/contacts/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listTrustedContactsAction, addTrustedContactAction, removeTrustedContactAction } from "@/lib/actions";

export default function ContactsPage() {
  const [items, setItems] = useState<Array<{ id: string; trusted: Record<string, string> }>>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listTrustedContactsAction();
    if (res.ok) setItems(res.data);
  });

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add trusted contact</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Your password to confirm" />
          <Button className="w-full" loading={pending} onClick={() => start(async () => {
            const res = await addTrustedContactAction(username.replace(/^@/, ""), password);
            if (!res.ok) return push(res.error, "error");
            push("Contact added"); setUsername(""); setPassword(""); load();
          })}>Add</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Trusted contacts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex justify-between rounded-lg border p-3 text-sm">
              <span>@{c.trusted.username}</span>
              <Button size="sm" variant="outline" onClick={() => start(async () => { await removeTrustedContactAction(c.id); load(); })}>Remove</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
`);

write("apps/user/app/(app)/rewards/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa } from "@relay/ui";
import { listRewardsAction } from "@/lib/actions";

export default function RewardsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void listRewardsAction().then((r) => r.ok && setItems(r.data as Array<Record<string, unknown>>));
  }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Rewards earned</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((r, i) => (
          <div key={i} className="flex justify-between rounded-lg border p-3 text-sm">
            <span>{String(r.useCase)}</span>
            <strong className="text-emerald-600">+{formatPaisa(String(r.amountPaisa))}</strong>
          </div>
        ))}
        {!items.length && <p className="text-slate-500">Complete verification and pay requests to earn rewards.</p>}
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/login/page.tsx", `import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Relay Admin</h1>
        <p className="text-sm text-slate-500">Operations console</p>
      </div>
      <AuthForm
        action={loginAction}
        submitLabel="Admin sign in"
        fields={[
          { name: "emailOrUsername", label: "Email", placeholder: "admin@relay.local" },
          { name: "password", label: "Password", type: "password" },
        ]}
      />
    </div>
  );
}
`);

write("apps/admin/components/auth-form.tsx", `'use client';
import { useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({ action, fields, submitLabel }: {
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string }>;
  submitLabel: string;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card>
      <CardHeader><CardTitle>{submitLabel}</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-3" action={(fd) => start(async () => {
          const res = await action(fd);
          if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
        })}>
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              <Input name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} required />
            </div>
          ))}
          <Button type="submit" className="w-full" loading={pending}>{submitLabel}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/(admin)/layout.tsx", `import { redirect } from "next/navigation";
import { getToken } from "@/lib/api";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { Button } from "@relay/ui";

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-bold">Relay Admin</span>
            <nav className="flex gap-3 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-slate-600 hover:text-slate-900">{l.label}</Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}><Button type="submit" variant="outline" size="sm">Sign out</Button></form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
`);

write("apps/admin/app/(admin)/users/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listUsersAction, suspendUserAction, unsuspendUserAction } from "@/lib/actions";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = (query = q) => start(async () => {
    const res = await listUsersAction(query || undefined);
    if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
  });

  useEffect(() => { load(""); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, username" />
          <Button onClick={() => load()} loading={pending}>Search</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">User</th><th>Status</th><th>Abuse</th><th></th></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={String(u.id)} className="border-b">
                  <td className="p-2"><div className="font-medium">{String(u.name)}</div><div className="text-slate-500">@{String(u.username)}</div></td>
                  <td><Badge variant={String(u.status) === "ACTIVE" ? "success" : "warning"}>{String(u.status)}</Badge></td>
                  <td>{String(u.abuseDecision)}</td>
                  <td className="space-x-1">
                    {String(u.status) !== "SUSPENDED" ? (
                      <Button size="sm" variant="destructive" onClick={() => start(async () => { await suspendUserAction(String(u.id)); push("Suspended"); load(); })}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => start(async () => { await unsuspendUserAction(String(u.id)); load(); })}>Unsuspend</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/(admin)/transactions/page.tsx", `'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Badge } from "@relay/ui";
import { listTransactionsAction } from "@/lib/actions";

export default function TransactionsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => { void listTransactionsAction().then((r) => r.ok && setItems(r.data.items as Array<Record<string, unknown>>)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Reference</th><th>Amount</th><th>Type</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={String(t.id)} className="border-b">
                <td className="p-2 font-mono text-xs">{String(t.reference)}</td>
                <td>{formatPaisa(String(t.amountPaisa))}</td>
                <td>{String(t.type)}</td>
                <td><Badge>{String(t.status)}</Badge></td>
                <td>{new Date(String(t.createdAt)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/(admin)/audit/page.tsx", `'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { listAuditLogsAction } from "@/lib/actions";

export default function AuditPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => { void listAuditLogsAction().then((r) => r.ok && setItems(r.data.items as Array<Record<string, unknown>>)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Audit logs</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {items.map((l) => (
          <div key={String(l.id)} className="rounded border p-3">
            <div className="font-medium">{String(l.action)} — {String(l.entityType)}</div>
            <div className="text-slate-500">{new Date(String(l.createdAt)).toLocaleString()}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/(admin)/reconciliation/page.tsx", `import { getReconciliationAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";

export default async function ReconciliationPage() {
  const res = await getReconciliationAction();
  if (!res.ok) return <p className="text-red-600">{res.error}</p>;
  const d = res.data;
  return (
    <Card>
      <CardHeader><CardTitle>Reconciliation</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between"><span>Status</span><Badge variant={d.status === "BALANCED" ? "success" : "destructive"}>{d.status}</Badge></div>
        <div className="flex justify-between"><span>Wallets checked</span><span>{d.walletCount}</span></div>
        <div className="flex justify-between"><span>Mismatches</span><span>{d.mismatches.length}</span></div>
      </CardContent>
    </Card>
  );
}
`);

write("apps/admin/app/(admin)/abuse/page.tsx", `'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listAbuseAction, allowAbuseAction } from "@/lib/actions";

export default function AbusePage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listAbuseAction();
    if (res.ok) setItems(res.data as Array<Record<string, unknown>>);
  });

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Abuse queue</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <div key={String(a.id)} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <div className="font-medium">User {String((a.user as Record<string, string>)?.username ?? a.userId)}</div>
              <Badge variant={String(a.decision) === "BLOCK" ? "destructive" : "warning"}>{String(a.decision)}</Badge>
              <div className="text-slate-500">Score {String(a.score)} · {String(a.engine)}</div>
            </div>
            <Button size="sm" onClick={() => start(async () => {
              const uid = String((a.user as Record<string, string>)?.id ?? "");
              if (!uid) return;
              await allowAbuseAction(uid);
              push("User allowed");
              load();
            })}>Allow</Button>
          </div>
        ))}
        {!items.length && <p className="text-slate-500">Queue empty.</p>}
      </CardContent>
    </Card>
  );
}
`);

console.log("Wrote page files.");
