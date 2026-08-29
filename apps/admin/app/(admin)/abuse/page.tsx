'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listAbuseAction, allowAbuseAction } from "@/lib/actions";

export default function AbusePage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listAbuseAction();
    if (res.ok) setItems(res.data as Array<Record<string, unknown>>);
  });

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Abuse queue</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <div key={String(a.id)} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <div className="font-medium">@{String(a.username ?? a.userId)}</div>
              <Badge variant={String(a.decision) === "BLOCK" ? "destructive" : "warning"}>{String(a.decision)}</Badge>
              <div className="text-slate-500">Score {String(a.score)} · {String(a.engine)}</div>
            </div>
            <Button size="sm" onClick={() => start(async () => {
              const uid = String(a.userId ?? "");
              if (!uid) return;
              await allowAbuseAction(uid);
              push("User allowed");
              load();
            })}>Allow</Button>
          </div>
        ))}
        {!items.length && <p className="text-slate-500">Queue empty.</p>}
      </CardContent>
    </Card>
  );
}
