"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Badge } from "@relay/ui";
import { listTransactionsAction } from "@/lib/actions";

export default function TransactionsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void listTransactionsAction().then(
      (r) => r.ok && setItems(r.data.items as Array<Record<string, unknown>>),
    );
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Reference</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={String(t.id)} className="border-b">
                <td className="p-2 font-mono text-xs">{String(t.reference)}</td>
                <td>{formatPaisa(String(t.amountPaisa))}</td>
                <td>{String(t.type)}</td>
                <td>
                  <Badge>{String(t.status)}</Badge>
                </td>
                <td>{new Date(String(t.createdAt)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
