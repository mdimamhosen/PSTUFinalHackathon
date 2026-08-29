"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  formatPaisa,
  humanizeLabel,
  Input,
  parseTakaInput,
  Skeleton,
  statusBadgeVariant,
  useModal,
  useToast,
} from "@relay/ui";
import {
  createSplitBillAction,
  listSplitBillsAction,
  paySplitShareAction,
  declineSplitShareAction,
  cancelSplitBillAction,
  getMeAction,
} from "@/lib/actions";

export function SplitPanel() {
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [debtors, setDebtors] = useState("");
  const [perShare, setPerShare] = useState("");
  const [bills, setBills] = useState<Array<Record<string, unknown>>>([]);
  const [myUsername, setMyUsername] = useState("");
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();
  const { confirm, alert } = useModal();

  const load = () =>
    start(async () => {
      const res = await listSplitBillsAction();
      if (res.ok) setBills(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load();
    void getMeAction().then((r) => r.ok && setMyUsername(String(r.data.user.username)));
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <Card>
        <CardHeader>
          <CardTitle>Split a bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Title" htmlFor="split-title">
            <Input
              id="split-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dinner"
            />
          </Field>
          <Field label="Total (৳)" htmlFor="split-total">
            <Input
              id="split-total"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Debtor usernames" htmlFor="split-debtors">
            <Input
              id="split-debtors"
              value={debtors}
              onChange={(e) => setDebtors(e.target.value)}
              placeholder="Comma separated"
            />
          </Field>
          <Field label="Each share (৳)" htmlFor="split-share">
            <Input
              id="split-share"
              value={perShare}
              onChange={(e) => setPerShare(e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const usernames = debtors
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const shareAmt = parseTakaInput(perShare);
                const shares = usernames.map((u) => ({
                  toUsername: u.replace(/^@/, ""),
                  amountPaisa: shareAmt,
                }));
                const hostShare = {
                  toUsername: myUsername,
                  amountPaisa: String(
                    Number(parseTakaInput(total)) - shares.length * Number(shareAmt),
                  ),
                };
                const res = await createSplitBillAction({
                  title,
                  totalAmountPaisa: parseTakaInput(total),
                  shares: [...shares, hostShare],
                });
                if (!res.ok) return push(res.error, "error");
                push("Split created", "success");
                setTitle("");
                setTotal("");
                setDebtors("");
                setPerShare("");
                load();
              })
            }
          >
            Create split
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your splits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}
          {bills.map((bill) => {
            const shares = (bill.shares as Array<Record<string, unknown>>) ?? [];
            return (
              <div key={String(bill.id)} className="rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{String(bill.title)}</strong>
                  <Badge variant={statusBadgeVariant(bill.status)}>
                    {humanizeLabel(bill.status)}
                  </Badge>
                </div>
                <p className="mt-1 tabular text-[hsl(var(--muted-foreground))]">
                  {formatPaisa(String(bill.totalAmountPaisa))}
                </p>
                {shares.map((s) => {
                  const user = s.user as Record<string, string>;
                  const mine = user.username === myUsername;
                  return (
                    <div
                      key={String(s.id)}
                      className="mt-2 flex flex-col gap-2 rounded-lg bg-[hsl(var(--muted))]/60 p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        @{user.username} — {formatPaisa(String(s.amountPaisa))}{" "}
                        <Badge variant={statusBadgeVariant(s.status)} className="ml-1">
                          {humanizeLabel(s.status)}
                        </Badge>
                      </span>
                      {mine && String(s.status) === "PENDING" && String(s.kind) === "DEBTOR" && (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            onClick={() =>
                              start(async () => {
                                const ok = await confirm({
                                  title: "Pay your share?",
                                  description: `Pay ${formatPaisa(String(s.amountPaisa))} for “${String(bill.title)}”.`,
                                  confirmLabel: "Pay share",
                                });
                                if (!ok) return;
                                const r = await paySplitShareAction(
                                  String(bill.id),
                                  String(s.id),
                                );
                                if (!r.ok) {
                                  await alert({
                                    title: "Payment failed",
                                    description: r.error,
                                    variant: "error",
                                  });
                                  return;
                                }
                                push("Paid", "success");
                                load();
                              })
                            }
                          >
                            Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              start(async () => {
                                const ok = await confirm({
                                  title: "Decline your share?",
                                  description: "The host will be notified.",
                                  confirmLabel: "Decline",
                                  destructive: true,
                                });
                                if (!ok) return;
                                await declineSplitShareAction(String(bill.id), String(s.id));
                                push("Share declined");
                                load();
                              })
                            }
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {String(bill.status) === "OPEN" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      start(async () => {
                        const ok = await confirm({
                          title: "Cancel this bill?",
                          description: "Open shares will be cancelled. Paid shares are unchanged.",
                          confirmLabel: "Cancel bill",
                          destructive: true,
                        });
                        if (!ok) return;
                        await cancelSplitBillAction(String(bill.id));
                        push("Bill cancelled");
                        load();
                      })
                    }
                  >
                    Cancel bill
                  </Button>
                )}
              </div>
            );
          })}
          {loaded && !bills.length ? (
            <EmptyState title="No splits yet" description="Create a bill to split with friends." />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
