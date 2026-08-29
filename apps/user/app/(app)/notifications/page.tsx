"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@relay/ui";
import { listNotificationsAction, readNotificationAction } from "@/lib/actions";

export default function NotificationsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    start(async () => {
      const res = await listNotificationsAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Notifications" description="OTP codes, payments, and account alerts" />
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {items.map((n) => (
            <div key={String(n.id)} className="rounded-xl border p-3 text-sm">
              <div className="font-medium">{String(n.title)}</div>
              <div className="mt-1 text-[hsl(var(--muted-foreground))]">{String(n.body)}</div>
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
          {loaded && !items.length ? (
            <EmptyState title="No notifications" description="You’re all caught up." />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
