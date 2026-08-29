"use client";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@relay/ui";
import { listNotificationsAction, readNotificationAction } from "@/lib/actions";

export default function NotificationsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [, start] = useTransition();

  const load = () =>
    start(async () => {
      const res = await listNotificationsAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
    });

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((n) => (
          <div key={String(n.id)} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{String(n.title)}</div>
            <div className="text-slate-600">{String(n.body)}</div>
            {!n.readAt && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() =>
                  start(async () => {
                    await readNotificationAction(String(n.id));
                    load();
                  })
                }
              >
                Mark read
              </Button>
            )}
          </div>
        ))}
        {!items.length && <p className="text-slate-500">No notifications.</p>}
      </CardContent>
    </Card>
  );
}
