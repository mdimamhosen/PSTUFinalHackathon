"use client";
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
              {l.entityId ? ` · ${String(l.entityId).slice(0, 8)}…` : ""}
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
