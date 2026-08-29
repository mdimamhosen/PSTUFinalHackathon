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
  getMeAction,
  createPaymentLinkAction,
  listPaymentLinksAction,
  revokePaymentLinkAction,
} from "@/lib/actions";
import QRCode from "qrcode";

export function ReceivePanel() {
  const [account, setAccount] = useState("");
  const [qr, setQr] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown>>>([]);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();
  const { confirm, alert } = useModal();

  const loadLinks = () =>
    start(async () => {
      const res = await listPaymentLinksAction();
      if (res.ok) setLinks(res.data.items as Array<Record<string, unknown>>);
      setLoaded(true);
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
    <div className="space-y-4 animate-in">
      <Card>
        <CardHeader>
          <CardTitle>Your account QR</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          {qr ? (
            <img src={qr} alt="Account QR" className="max-w-full rounded-lg border" />
          ) : (
            <Skeleton className="size-[200px]" />
          )}
          <p className="break-all font-mono text-sm">{account || "…"}</p>
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            Others can scan or enter this to pay you
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create payment link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Fixed amount (optional)" htmlFor="link-amount">
            <Input
              id="link-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Leave empty for any amount"
              inputMode="decimal"
            />
          </Field>
          <Field label="Note" htmlFor="link-note">
            <Input id="link-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const body: { amountPaisa?: string; note?: string } = { note: note || undefined };
                if (amount) body.amountPaisa = parseTakaInput(amount);
                const res = await createPaymentLinkAction(body);
                if (!res.ok) return push(res.error, "error");
                push("Link created", "success");
                setAmount("");
                setNote("");
                loadLinks();
              })
            }
          >
            Create link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {links.map((l) => (
            <div key={String(l.publicToken)} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {l.amountPaisa ? formatPaisa(String(l.amountPaisa)) : "Any amount"}
                </div>
                <Badge variant={statusBadgeVariant(l.status)}>{humanizeLabel(l.status)}</Badge>
              </div>
              <a href={String(l.url)} className="mt-1 block break-all text-[hsl(var(--primary))]">
                {String(l.url)}
              </a>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(String(l.url));
                    push("Copied", "success");
                  }}
                >
                  Copy
                </Button>
                {String(l.status) === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      start(async () => {
                        const ok = await confirm({
                          title: "Revoke this link?",
                          description: "People will no longer be able to pay with it.",
                          confirmLabel: "Revoke",
                          destructive: true,
                        });
                        if (!ok) return;
                        await revokePaymentLinkAction(String(l.publicToken));
                        await alert({
                          title: "Link revoked",
                          description: "This payment link is no longer active.",
                          variant: "success",
                        });
                        loadLinks();
                      })
                    }
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
          {loaded && !links.length ? (
            <EmptyState title="No links yet" description="Create a payment link to share." />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
