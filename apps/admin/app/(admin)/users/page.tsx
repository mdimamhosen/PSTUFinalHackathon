'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listUsersAction, suspendUserAction, unsuspendUserAction } from "@/lib/actions";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = (query = q) => start(async () => {
    const res = await listUsersAction(query || undefined);
    if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
  });

  useEffect(() => { load(""); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, username" />
          <Button onClick={() => load()} loading={pending}>Search</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">User</th><th>Status</th><th>Abuse</th><th></th></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={String(u.id)} className="border-b">
                  <td className="p-2"><div className="font-medium">{String(u.name)}</div><div className="text-slate-500">@{String(u.username)}</div></td>
                  <td><Badge variant={String(u.status) === "ACTIVE" ? "success" : "warning"}>{String(u.status)}</Badge></td>
                  <td>{String(u.abuseDecision)}</td>
                  <td className="space-x-1">
                    {String(u.status) !== "SUSPENDED" ? (
                      <Button size="sm" variant="destructive" onClick={() => start(async () => { await suspendUserAction(String(u.id)); push("Suspended"); load(); })}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => start(async () => { await unsuspendUserAction(String(u.id)); load(); })}>Unsuspend</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
