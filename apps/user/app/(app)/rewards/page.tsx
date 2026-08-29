"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  formatPaisa,
  humanizeLabel,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { listRewardsAction } from "@/lib/actions";

export default function RewardsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    start(async () => {
      const r = await listRewardsAction();
      if (r.ok) setItems(r.data as Array<Record<string, unknown>>);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Rewards" description="Cashback earned from Relay actions" />
      <Card>
        <CardHeader>
          <CardTitle>Earned</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}
          {items.map((r, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
            >
              <span>{humanizeLabel(r.useCase)}</span>
              <strong className="tabular text-emerald-700">
                +{formatPaisa(String(r.amountPaisa))}
              </strong>
            </div>
          ))}
          {loaded && !items.length ? (
            <EmptyState
              title="No rewards yet"
              description="Complete verification and pay requests to earn rewards."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
