import Link from "next/link";
import { getMeAction } from "@/lib/actions";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  formatPaisa,
  humanizeLabel,
  PageHeader,
  statusBadgeVariant,
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
        title={`Hi, ${String(user.name).split(" ")[0]}`}
        description={`@${user.username as string}`}
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
            variant={statusBadgeVariant(user.status)}
            className="bg-white/15 text-white ring-white/20"
          >
            {humanizeLabel(user.status)}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
