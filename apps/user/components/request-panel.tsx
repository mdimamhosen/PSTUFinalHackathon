"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  formatPaisa,
  parseTakaInput,
  Badge,
  PageHeader,
  EmptyState,
} from "@relay/ui";
import { useToast } from "@relay/ui";
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
  const { push } = useToast();

  const load = () =>
    start(async () => {
      const res = await listMoneyRequestsAction();
      if (res.ok) setItems(res.data.items as Array<Record<string, unknown>>);
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
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Payer username"
          />
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount ৳"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
          />
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
                push("Request sent");
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
          {items.map((item) => {
            const requester = item.requester as Record<string, string> | undefined;
            const payer = item.payer as Record<string, string>;
            const isPayer = payer?.username === myUsername;
            const isRequester = requester?.username === myUsername;
            return (
              <div key={String(item.id)} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{formatPaisa(String(item.amountPaisa))}</strong>
                  <Badge variant={String(item.status) === "PENDING" ? "warning" : "secondary"}>
                    {String(item.status)}
                  </Badge>
                </div>
                <p className="text-slate-500">
                  {isPayer ? `From @${requester?.username}` : `To @${payer?.username}`}
                </p>
                {String(item.status) === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    {isPayer && (
                      <>
                        <Button
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            start(async () => {
                              const r = await payMoneyRequestAction(String(item.id));
                              r.ok ? (push("Paid"), load()) : push(r.error, "error");
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
                              await declineMoneyRequestAction(String(item.id));
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
                            await cancelMoneyRequestAction(String(item.id));
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
          {!items.length ? (
        <EmptyState title="No requests" description="Create a request or wait for someone to ask you." />
      ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
