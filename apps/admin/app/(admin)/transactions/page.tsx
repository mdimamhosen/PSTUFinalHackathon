"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  EmptyState,
  formatPaisa,
  humanizeLabel,
  PageHeader,
  statusBadgeVariant,
  TableSkeleton,
} from "@relay/ui";
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
          <table className="w-full min-w-[640px] text-left text-sm">
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
                  <td className="px-4 py-3">{humanizeLabel(t.type)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant(t.status)}>{humanizeLabel(t.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(String(t.createdAt)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pending && !loaded ? <TableSkeleton /> : null}
        {loaded && !items.length ? (
          <div className="p-4">
            <EmptyState title="No transactions" description="Completed transfers will appear here." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
