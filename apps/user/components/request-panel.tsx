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
  PageHeader,
  parseTakaInput,
  Skeleton,
  statusBadgeVariant,
  useModal,
  useToast,
} from "@relay/ui";
import {
  createMoneyRequestAction,
  listMoneyRequestsAction,
  payMoneyRequestAction,
  declineMoneyRequestAction,
  cancelMoneyRequestAction,
  getMeAction,
} from "@/lib/actions";

export function RequestPanel() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();
  const { confirm, alert } = useModal();

  const load = () =>
    start(async () => {
      const res = await listMoneyRequestsAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
    });

  useEffect(() => {
    load();
    void getMeAction().then((r) => r.ok && setMyUsername(String(r.data.user.username)));
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Requests" description="Ask for money or pay pending requests" />
      <Card>
        <CardHeader>
          <CardTitle>Request money</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Payer username" htmlFor="payer">
            <Input
              id="payer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@karim"
            />
          </Field>
          <Field label="Amount (৳)" htmlFor="req-amount">
            <Input
              id="req-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Note" htmlFor="req-note">
            <Input
              id="req-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await createMoneyRequestAction({
                  toUsername: username.replace(/^@/, ""),
                  amountPaisa: parseTakaInput(amount),
                  note: note || undefined,
                });
                if (!res.ok) return push(res.error, "error");
                push("Request sent", "success");
                setUsername("");
                setAmount("");
                setNote("");
                load();
              })
            }
          >
            Send request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {items.map((item) => {
            const requester = item.requester as Record<string, string> | undefined;
            const payer = item.payer as Record<string, string>;
            const isPayer = payer?.username === myUsername;
            const isRequester = requester?.username === myUsername;
            return (
              <div key={String(item.id)} className="rounded-xl border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="tabular">{formatPaisa(String(item.amountPaisa))}</strong>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {humanizeLabel(item.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                  {isPayer ? `From @${requester?.username}` : `To @${payer?.username}`}
                </p>
                {String(item.status) === "PENDING" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isPayer && (
                      <>
                        <Button
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            start(async () => {
                              const ok = await confirm({
                                title: "Pay this request?",
                                description: `Send ${formatPaisa(String(item.amountPaisa))} to @${requester?.username}.`,
                                confirmLabel: "Pay now",
                              });
                              if (!ok) return;
                              const r = await payMoneyRequestAction(String(item.id));
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
                                title: "Decline this request?",
                                description: "The requester will be notified.",
                                confirmLabel: "Decline",
                                destructive: true,
                              });
                              if (!ok) return;
                              await declineMoneyRequestAction(String(item.id));
                              push("Request declined");
                              load();
                            })
                          }
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {isRequester && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          start(async () => {
                            const ok = await confirm({
                              title: "Cancel this request?",
                              description: "You can create a new request later.",
                              confirmLabel: "Cancel request",
                              destructive: true,
                            });
                            if (!ok) return;
                            await cancelMoneyRequestAction(String(item.id));
                            push("Request cancelled");
                            load();
                          })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {loaded && !items.length ? (
            <EmptyState
              title="No requests"
              description="Create a request or wait for someone to ask you."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
