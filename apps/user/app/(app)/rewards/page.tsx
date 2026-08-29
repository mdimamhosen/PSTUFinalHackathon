"use client";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa } from "@relay/ui";
import { listRewardsAction } from "@/lib/actions";

export default function RewardsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void listRewardsAction().then(
      (r) => r.ok && setItems(r.data as Array<Record<string, unknown>>),
    );
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards earned</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((r, i) => (
          <div key={i} className="flex justify-between rounded-lg border p-3 text-sm">
            <span>{String(r.useCase)}</span>
            <strong className="text-emerald-600">+{formatPaisa(String(r.amountPaisa))}</strong>
          </div>
        ))}
        {!items.length && (
          <p className="text-slate-500">Complete verification and pay requests to earn rewards.</p>
        )}
      </CardContent>
    </Card>
  );
}
