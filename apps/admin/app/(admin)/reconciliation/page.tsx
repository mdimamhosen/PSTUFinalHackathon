import { getReconciliationAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@relay/ui";

export default async function ReconciliationPage() {
  const res = await getReconciliationAction();
  if (!res.ok) return <p className="text-red-600">{res.error}</p>;
  const d = res.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Status</span>
          <Badge variant={d.status === "BALANCED" ? "success" : "destructive"}>{d.status}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Wallets checked</span>
          <span>{d.walletCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Mismatches</span>
          <span>{d.mismatches.length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
