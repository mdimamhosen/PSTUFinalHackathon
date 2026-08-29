import { getReconciliationAction } from "@/lib/actions";
import { Alert, Badge, Card, CardContent, EmptyState, PageHeader } from "@relay/ui";

export default async function ReconciliationPage() {
  const res = await getReconciliationAction();
  if (!res.ok) {
    return (
      <Alert variant="error" title="Reconciliation failed">
        {res.error}
      </Alert>
    );
  }
  const d = res.data;
  const balanced = d.status === "BALANCED";
  return (
    <div className="space-y-4 animate-in">
      <PageHeader
        title="Reconciliation"
        description="Wallet balance vs ledger sum — read only"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Status
            </p>
            <div className="mt-2">
              <Badge variant={balanced ? "success" : "destructive"}>{d.status}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Wallets checked
            </p>
            <p className="mt-2 text-2xl font-bold tabular">{d.walletCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Mismatches
            </p>
            <p className="mt-2 text-2xl font-bold tabular">{d.mismatches.length}</p>
          </CardContent>
        </Card>
      </div>
      {balanced ? (
        <EmptyState
          title="All wallets balanced"
          description="Every wallet balance_paisa matches its ledger SUM."
        />
      ) : (
        <Alert variant="error" title="Integrity mismatch">
          Review mismatch rows carefully. Admins never patch balances directly.
        </Alert>
      )}
    </div>
  );
}
