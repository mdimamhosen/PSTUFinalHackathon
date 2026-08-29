"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Button,
  EmptyState,
  humanizeLabel,
  PageHeader,
  statusBadgeVariant,
  TableSkeleton,
  useModal,
  useToast,
} from "@relay/ui";
import { listAbuseAction, allowAbuseAction } from "@/lib/actions";

export default function AbusePage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();
  const { confirm } = useModal();

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
        description="Review flagged accounts. Allowing a user does not change wallet balances."
      />
      {pending && !loaded ? <TableSkeleton rows={3} /> : null}
      <div className="space-y-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="flex flex-col gap-3 rounded-2xl border bg-[hsl(var(--card))] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">@{String(a.username ?? a.userId)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(a.decision)}>{humanizeLabel(a.decision)}</Badge>
                <Badge variant="outline">{humanizeLabel(a.engine)}</Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Score {String(a.score)}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() =>
                start(async () => {
                  const uid = String(a.userId ?? "");
                  if (!uid) return;
                  const ok = await confirm({
                    title: "Allow this user?",
                    description:
                      "They will leave the abuse queue and regain normal transfer access. Balances are not changed.",
                    confirmLabel: "Allow user",
                  });
                  if (!ok) return;
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
        <EmptyState
          title="Queue empty"
          description="No accounts currently need admin review or are blocked."
        />
      ) : null}
    </div>
  );
}
