import { getTransferAction } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, formatPaisa, Badge } from "@relay/ui";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTransferAction(id);
  if (!res.ok) return <p className="text-red-600">{res.error}</p>;
  const tx = res.data as Record<string, unknown>;
  return (
    <Card>
      <CardHeader><CardTitle>Transfer receipt</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Reference</span><span className="font-mono">{String(tx.reference)}</span></div>
        <div className="flex justify-between"><span>Amount</span><strong>{formatPaisa(String(tx.amountPaisa))}</strong></div>
        <div className="flex justify-between"><span>Status</span><Badge>{String(tx.status)}</Badge></div>
      </CardContent>
    </Card>
  );
}
