"use client";
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
