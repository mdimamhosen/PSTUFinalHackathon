"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Skeleton } from "@relay/ui";
import { listActivityAction } from "@/lib/actions";

export default function ActivityPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      const res = await listActivityAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending && !items.length ? <Skeleton className="h-16 w-full" /> : null}
          {items.map((a) => (
            <div key={String(a.id)} className="flex justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">{String(a.type)}</div>
                <div className="text-slate-500">
                  {new Date(String(a.createdAt)).toLocaleString()}
                </div>
              </div>
              <div className={String(a.direction) === "OUT" ? "text-red-600" : "text-emerald-600"}>
                {String(a.direction) === "OUT" ? "-" : "+"}
                {formatPaisa(String(a.amountPaisa))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/contacts" className="rounded-lg border p-3 text-center text-sm">
          Trusted contacts
        </Link>
        <Link href="/rewards" className="rounded-lg border p-3 text-center text-sm">
          Rewards
        </Link>
      </div>
    </div>
  );
}
