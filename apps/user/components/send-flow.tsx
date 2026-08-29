"use client";
import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  formatPaisa,
  parseTakaInput,
  useModal,
  useToast,
} from "@relay/ui";
import { searchUsersAction, quoteTransferAction, confirmTransferAction } from "@/lib/actions";
import Link from "next/link";

type Step = "search" | "amount" | "confirm" | "done";

const stepLabel: Record<Step, string> = {
  search: "Search",
  amount: "Amount",
  confirm: "Confirm",
  done: "Done",
};

function buildRecipientField(
  recipient: Record<string, string> | null,
  preset?: Record<string, string>,
): Record<string, string> {
  if (recipient?.username) return { toUsername: recipient.username };
  if (recipient?.accountNumber) return { toAccountNumber: recipient.accountNumber };
  if (preset?.paymentLinkToken) return { paymentLinkToken: preset.paymentLinkToken };
  return {};
}

export function SendFlow({ preset }: { preset?: Record<string, string> } = {}) {
  const [step, setStep] = useState<Step>(preset ? "amount" : "search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [searched, setSearched] = useState(false);
  const [recipient, setRecipient] = useState<Record<string, string> | null>(
    preset ? { username: preset.toUsername ?? "", ...preset } : null,
  );
  const [amount, setAmount] = useState(
    preset?.amountPaisa ? String(Number(preset.amountPaisa) / 100) : "",
  );
  const [quote, setQuote] = useState<Record<string, string> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [pending, start] = useTransition();
  const { push } = useToast();
  const { confirm, alert } = useModal();

  return (
    <div className="space-y-4 animate-in">
      <PageHeader
        title="Send money"
        description="Search, quote, then confirm — nothing moves until you confirm."
      />

      <div className="flex flex-wrap gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        {(["search", "amount", "confirm", "done"] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-2.5 py-1 ${
              step === s
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))]"
            }`}
          >
            {i + 1}. {stepLabel[s]}
          </span>
        ))}
      </div>

      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Find recipient</CardTitle>
            <CardDescription>Username, email, or BD phone — never a UUID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Search" htmlFor="q">
              <Input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@karim or 01XXXXXXXXX"
              />
            </Field>
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await searchUsersAction(query);
                  setSearched(true);
                  if (!res.ok) return push(res.error, "error");
                  setResults(res.data.items as Array<Record<string, string>>);
                })
              }
            >
              Search
            </Button>
            <div className="space-y-2">
              {results.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  className="w-full rounded-xl border p-3 text-left transition hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--accent))]/50"
                  onClick={() => {
                    setRecipient(u);
                    setStep("amount");
                  }}
                >
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    @{u.username} · <span className="font-mono text-xs">{u.accountNumber}</span>
                  </div>
                </button>
              ))}
              {searched && !results.length ? (
                <EmptyState
                  title="No matches"
                  description="Try another username, email, or phone number."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "amount" && recipient && (
        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
            <CardDescription>
              To @{recipient.username || recipient.accountNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="You send (৳)" htmlFor="amount" hint="Enter taka, e.g. 2500.00">
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="text-lg tabular font-semibold"
              />
            </Field>
            <div className="flex gap-2">
              {!preset ? (
                <Button variant="outline" className="flex-1" onClick={() => setStep("search")}>
                  Back
                </Button>
              ) : null}
              <Button
                className="flex-1"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const body: Record<string, string> = {
                      ...buildRecipientField(recipient, preset),
                      amountPaisa: parseTakaInput(amount),
                    };
                    const res = await quoteTransferAction(body);
                    if (!res.ok) return push(res.error, "error");
                    setQuote(res.data.quote as Record<string, string>);
                    setRecipient(res.data.recipient as Record<string, string>);
                    setStep("confirm");
                  })
                }
              >
                Get quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && quote && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm payment</CardTitle>
            <CardDescription>Review the quote before money moves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-xl bg-[hsl(var(--muted))]/70 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">You send</span>
                <strong className="tabular">{quote.youSend}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">They receive</span>
                <strong className="tabular">{quote.theyReceive}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Fee</span>
                <span className="tabular">{quote.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Delivery</span>
                <span>{quote.delivery}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button
                className="flex-1"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const ok = await confirm({
                      title: "Send this payment?",
                      description: `You will send ${quote.youSend} to @${recipient?.username || recipient?.accountNumber}. This cannot be undone.`,
                      confirmLabel: "Confirm & pay",
                    });
                    if (!ok) return;
                    const body: Record<string, string> = {
                      ...buildRecipientField(recipient, preset),
                      amountPaisa: parseTakaInput(amount),
                      description: "Relay transfer",
                    };
                    const res = await confirmTransferAction(body);
                    if (!res.ok) {
                      await alert({
                        title: "Payment failed",
                        description: res.error,
                        variant: "error",
                      });
                      return;
                    }
                    setReceipt(res.data as Record<string, unknown>);
                    setStep("done");
                    push("Payment sent", "success");
                  })
                }
              >
                Confirm & pay
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && receipt && (
        <Card className="border-emerald-200/80">
          <CardHeader>
            <CardTitle>Payment sent</CardTitle>
            <CardDescription>Keep this TrxID for your records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success" title="Completed">
              Money moved through the Transfer Engine with double-entry ledger.
            </Alert>
            <div className="rounded-xl bg-[hsl(var(--muted))]/70 p-4 text-sm">
              <p className="text-[hsl(var(--muted-foreground))]">TrxID</p>
              <p className="mt-1 font-mono text-base font-semibold tracking-tight">
                {String(receipt.reference)}
              </p>
              <p className="mt-3 text-[hsl(var(--muted-foreground))]">Amount</p>
              <p className="mt-1 text-lg font-semibold tabular">
                {formatPaisa(String(receipt.amountPaisa))}
              </p>
            </div>
            <Link
              href={`/send/receipt/${receipt.id}`}
              className="block text-center text-sm font-semibold text-[hsl(var(--primary))] hover:underline"
            >
              View full receipt
            </Link>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                setStep("search");
                setReceipt(null);
                setQuote(null);
                setAmount("");
                setRecipient(null);
                setSearched(false);
              }}
            >
              Send again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
