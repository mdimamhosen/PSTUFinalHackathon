"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { listAuditLogsAction } from "@/lib/actions";

export default function AuditPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void listAuditLogsAction().then(
      (r) => r.ok && setItems(r.data.items as Array<Record<string, unknown>>),
    );
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {items.map((l) => (
          <div key={String(l.id)} className="rounded border p-3">
            <div className="font-medium">
              {String(l.action)} — {String(l.entityType)}
            </div>
            <div className="text-slate-500">{new Date(String(l.createdAt)).toLocaleString()}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
