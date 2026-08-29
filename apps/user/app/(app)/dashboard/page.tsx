import Link from "next/link";
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
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl border bg-white p-4 text-center shadow-sm hover:bg-slate-50"
          >
            <div className="text-2xl">{a.icon}</div>
            <div className="font-medium">{a.label}</div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
              {String(user.status)}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account</span>
            <span className="font-mono">{String(user.accountNumber)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <Link href="/contacts" className="rounded-lg border p-3 hover:bg-slate-50">
          Contacts
        </Link>
        <Link href="/rewards" className="rounded-lg border p-3 hover:bg-slate-50">
          Rewards
        </Link>
        <Link href="/notifications" className="rounded-lg border p-3 hover:bg-slate-50">
          Alerts
        </Link>
      </div>
    </div>
  );
}
