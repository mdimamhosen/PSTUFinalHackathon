'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput, Badge } from "@relay/ui";
import { useToast } from "@relay/ui";
import { createSplitBillAction, listSplitBillsAction, paySplitShareAction, declineSplitShareAction, cancelSplitBillAction, getMeAction } from "@/lib/actions";

export function SplitPanel() {
  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [debtors, setDebtors] = useState("");
  const [perShare, setPerShare] = useState("");
  const [bills, setBills] = useState<Array<Record<string, unknown>>>([]);
  const [myUsername, setMyUsername] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listSplitBillsAction();
    if (res.ok) setBills(res.data.items as Array<Record<string, unknown>>);
  });

  useEffect(() => {
    load();
    void getMeAction().then((r) => r.ok && setMyUsername(String(r.data.user.username)));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Split a bill</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title e.g. Dinner" />
          <Input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total ৳" />
          <Input value={debtors} onChange={(e) => setDebtors(e.target.value)} placeholder="Debtor usernames (comma separated)" />
          <Input value={perShare} onChange={(e) => setPerShare(e.target.value)} placeholder="Each share ৳" />
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const usernames = debtors.split(",").map((s) => s.trim()).filter(Boolean);
                const shareAmt = parseTakaInput(perShare);
                const shares = usernames.map((u) => ({ toUsername: u.replace(/^@/, ""), amountPaisa: shareAmt }));
                const hostShare = { toUsername: myUsername, amountPaisa: String(Number(parseTakaInput(total)) - shares.length * Number(shareAmt)) };
                const res = await createSplitBillAction({ title, totalAmountPaisa: parseTakaInput(total), shares: [...shares, hostShare] });
                if (!res.ok) return push(res.error, "error");
                push("Split created");
                setTitle(""); setTotal(""); setDebtors(""); setPerShare("");
                load();
              })
            }
          >
            Create split
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your splits</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {bills.map((bill) => {
            const shares = (bill.shares as Array<Record<string, unknown>>) ?? [];
            return (
              <div key={String(bill.id)} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{String(bill.title)}</strong>
                  <Badge>{String(bill.status)}</Badge>
                </div>
                <p>{formatPaisa(String(bill.totalAmountPaisa))}</p>
                {shares.map((s) => {
                  const user = s.user as Record<string, string>;
                  const mine = user.username === myUsername;
                  return (
                    <div key={String(s.id)} className="mt-2 flex items-center justify-between rounded bg-slate-50 p-2">
                      <span>@{user.username} — {formatPaisa(String(s.amountPaisa))}</span>
                      {mine && String(s.status) === "PENDING" && String(s.kind) === "DEBTOR" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => start(async () => { const r = await paySplitShareAction(String(bill.id), String(s.id)); r.ok ? (push("Paid"), load()) : push(r.error, "error"); })}>Pay</Button>
                          <Button size="sm" variant="outline" onClick={() => start(async () => { await declineSplitShareAction(String(bill.id), String(s.id)); load(); })}>Decline</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {String(bill.status) === "OPEN" && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => start(async () => { await cancelSplitBillAction(String(bill.id)); load(); })}>Cancel bill</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
