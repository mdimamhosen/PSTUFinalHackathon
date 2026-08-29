import { getTransferAction } from "@/lib/actions";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  formatPaisa,
  humanizeLabel,
  statusBadgeVariant,
} from "@relay/ui";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getTransferAction(id);
  if (!res.ok) return <p className="text-red-600">{res.error}</p>;
  const tx = res.data as Record<string, unknown>;
  return (
    <Card className="animate-in">
      <CardHeader>
        <CardTitle>Transfer receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[hsl(var(--muted-foreground))]">Reference</span>
          <span className="break-all font-mono">{String(tx.reference)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[hsl(var(--muted-foreground))]">Amount</span>
          <strong className="tabular">{formatPaisa(String(tx.amountPaisa))}</strong>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[hsl(var(--muted-foreground))]">Status</span>
          <Badge variant={statusBadgeVariant(tx.status)}>{humanizeLabel(tx.status)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
