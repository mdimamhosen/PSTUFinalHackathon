'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput } from "@relay/ui";
import { useToast } from "@relay/ui";
import { getMeAction, createPaymentLinkAction, listPaymentLinksAction, revokePaymentLinkAction } from "@/lib/actions";
import QRCode from "qrcode";

export function ReceivePanel() {
  const [account, setAccount] = useState("");
  const [qr, setQr] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const loadLinks = () =>
    start(async () => {
      const res = await listPaymentLinksAction();
      if (res.ok) setLinks(res.data.items as Array<Record<string, unknown>>);
    });

  useEffect(() => {
    void getMeAction().then(async (r) => {
      if (!r.ok) return;
      const acct = String(r.data.user.accountNumber);
      setAccount(acct);
      setQr(await QRCode.toDataURL(acct, { margin: 1, width: 200 }));
    });
    loadLinks();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Your account QR</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          {qr ? <img src={qr} alt="Account QR" className="rounded-lg border" /> : null}
          <p className="font-mono text-sm">{account}</p>
          <p className="text-xs text-slate-500">Others can scan or enter this to pay you</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Create payment link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Fixed amount (optional)" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const body: { amountPaisa?: string; note?: string } = { note: note || undefined };
                if (amount) body.amountPaisa = parseTakaInput(amount);
                const res = await createPaymentLinkAction(body);
                if (!res.ok) return push(res.error, "error");
                push("Link created");
                setAmount(""); setNote("");
                loadLinks();
              })
            }
          >
            Create link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your links</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {links.map((l) => (
            <div key={String(l.publicToken)} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{l.amountPaisa ? formatPaisa(String(l.amountPaisa)) : "Any amount"}</div>
              <a href={String(l.url)} className="break-all text-blue-600">{String(l.url)}</a>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(String(l.url))}>Copy</Button>
                {String(l.status) === "ACTIVE" && (
                  <Button size="sm" variant="destructive" onClick={() => start(async () => { await revokePaymentLinkAction(String(l.publicToken)); loadLinks(); })}>Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
