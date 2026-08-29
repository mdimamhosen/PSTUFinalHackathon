"use client";
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
                    {a.reference ? ` · ${String(a.reference)}` : ""}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-sm font-semibold tabular ${
                    credit ? "text-emerald-700" : "text-[hsl(var(--foreground))]"
                  }`}
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
