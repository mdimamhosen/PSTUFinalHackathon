"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { useToast } from "@relay/ui";
import { listUsersAction, suspendUserAction, unsuspendUserAction } from "@/lib/actions";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();

  const load = (query = q) =>
    start(async () => {
      const res = await listUsersAction(query || undefined);
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load("");
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Users" description="Search, suspend, and unsuspend accounts" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, username"
          className="sm:max-w-sm"
        />
        <Button onClick={() => load()} loading={pending}>
          Search
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-[hsl(var(--card))]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-[hsl(var(--muted))]/50 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Abuse</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((u) => (
                <tr key={String(u.id)} className="hover:bg-[hsl(var(--muted))]/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{String(u.name)}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      @{String(u.username)} · {String(u.email)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={String(u.status) === "ACTIVE" ? "success" : "warning"}>
                      {String(u.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{String(u.abuseDecision)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {String(u.status) !== "SUSPENDED" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          start(async () => {
                            await suspendUserAction(String(u.id));
                            push("User suspended", "success");
                            load();
                          })
                        }
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          start(async () => {
                            const res = await unsuspendUserAction(String(u.id));
                            if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
                            else {
                              push("User unsuspended", "success");
                              load();
                            }
                          })
                        }
                      >
                        Unsuspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pending && !loaded ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        {loaded && !items.length ? (
          <div className="p-4">
            <EmptyState title="No users found" description="Try a different search query." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
