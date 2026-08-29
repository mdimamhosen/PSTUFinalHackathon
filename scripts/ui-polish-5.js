const fs = require("fs");
const path = require("path");

function write(rel, content) {
  const p = path.join(process.cwd(), rel);
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("wrote", rel);
}

write(
  "apps/admin/app/(admin)/transactions/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import { Badge, EmptyState, formatPaisa, PageHeader, Skeleton } from "@relay/ui";
import { listTransactionsAction } from "@/lib/actions";

export default function TransactionsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    start(async () => {
      const r = await listTransactionsAction();
      if (r.ok) setItems(r.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Transactions" description="Read-only money movement history" />
      <div className="overflow-hidden rounded-2xl border bg-[hsl(var(--card))]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-[hsl(var(--muted))]/50 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((t) => (
                <tr key={String(t.id)} className="hover:bg-[hsl(var(--muted))]/40">
                  <td className="px-4 py-3 font-mono text-xs">{String(t.reference)}</td>
                  <td className="px-4 py-3 tabular font-semibold">
                    {formatPaisa(String(t.amountPaisa))}
                  </td>
                  <td className="px-4 py-3">{String(t.type)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={String(t.status) === "COMPLETED" ? "success" : "secondary"}>
                      {String(t.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(String(t.createdAt)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pending && !loaded ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}
        {loaded && !items.length ? (
          <div className="p-4">
            <EmptyState title="No transactions" description="Completed transfers will appear here." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
`,
);

write(
  "apps/admin/app/(admin)/audit/page.tsx",
  `"use client";
import { useEffect, useState, useTransition } from "react";
import { EmptyState, PageHeader, Skeleton } from "@relay/ui";
import { listAuditLogsAction } from "@/lib/actions";

export default function AuditPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    start(async () => {
      const r = await listAuditLogsAction();
      if (r.ok) setItems(r.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Audit logs" description="Immutable ops trail" />
      {pending && !loaded ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}
      <div className="space-y-2">
        {items.map((l) => (
          <div
            key={String(l.id)}
            className="rounded-2xl border bg-[hsl(var(--card))] px-4 py-3 text-sm"
          >
            <div className="font-semibold">
              {String(l.action)}{" "}
              <span className="font-normal text-[hsl(var(--muted-foreground))]">
                · {String(l.entityType)}
              </span>
            </div>
            <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {new Date(String(l.createdAt)).toLocaleString()}
              {l.entityId ? \` · \${String(l.entityId).slice(0, 8)}…\` : ""}
            </div>
          </div>
        ))}
      </div>
      {loaded && !items.length ? (
        <EmptyState title="No audit events" description="Actions will show up as the system is used." />
      ) : null}
    </div>
  );
}
`,
);

const requestPath = "apps/user/components/request-panel.tsx";
let req = fs.readFileSync(requestPath, "utf8");
if (!req.includes("PageHeader")) {
  req = req.replace(
    `  Badge,
} from "@relay/ui";`,
    `  Badge,
  PageHeader,
  EmptyState,
  Field,
} from "@relay/ui";`,
  );
  req = req.replace(
    `  return (
    <div className="space-y-4">
      <Card>`,
    `  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Requests" description="Ask for money or pay pending requests" />
      <Card>`,
  );
  if (req.includes("{!items.length &&")) {
    req = req.replace(
      /\{!items\.length &&[\s\S]*?\}/,
      `{!items.length ? (
        <EmptyState title="No requests" description="Create a request or wait for someone to ask you." />
      ) : null}`,
    );
  }
  fs.writeFileSync(requestPath, req.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log("patched request-panel");
}

console.log("batch 5 done");
