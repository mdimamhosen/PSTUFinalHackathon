'use client';
import { useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, formatPaisa, parseTakaInput } from "@relay/ui";
import { useToast } from "@relay/ui";
import { searchUsersAction, quoteTransferAction, confirmTransferAction } from "@/lib/actions";
import Link from "next/link";

type Step = "search" | "amount" | "confirm" | "done";

export function SendFlow({ preset?: Record<string, string> }) {
  const [step, setStep] = useState<Step>(preset ? "amount" : "search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [recipient, setRecipient] = useState<Record<string, string> | null>(preset ? { username: preset.toUsername ?? "", ...preset } : null);
  const [amount, setAmount] = useState(preset?.amountPaisa ? String(Number(preset.amountPaisa) / 100) : "");
  const [quote, setQuote] = useState<Record<string, string> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [pending, start] = useTransition();
  const { push } = useToast();

  const recipientField = recipient?.username
    ? { toUsername: recipient.username }
    : recipient?.accountNumber
      ? { toAccountNumber: recipient.accountNumber }
      : preset?.paymentLinkToken
        ? { paymentLinkToken: preset.paymentLinkToken }
        : {};

  return (
    <div className="space-y-4">
      {step === "search" && (
        <Card>
          <CardHeader><CardTitle>Find recipient</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Username, email, or phone" />
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await searchUsersAction(query);
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
                  className="w-full rounded-lg border p-3 text-left hover:bg-slate-50"
                  onClick={() => {
                    setRecipient(u);
                    setStep("amount");
                  }}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-slate-500">@{u.username}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "amount" && recipient && (
        <Card>
          <CardHeader><CardTitle>Send to @{recipient.username || recipient.accountNumber}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in ৳" inputMode="decimal" />
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const body = { ...recipientField, amountPaisa: parseTakaInput(amount) };
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
          </CardContent>
        </Card>
      )}

      {step === "confirm" && quote && (
        <Card>
          <CardHeader><CardTitle>Confirm payment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>You send</span><strong>{quote.youSend}</strong></div>
            <div className="flex justify-between"><span>They receive</span><strong>{quote.theyReceive}</strong></div>
            <div className="flex justify-between"><span>Fee</span><span>{quote.fee}</span></div>
            <Button
              className="w-full"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const body = { ...recipientField, amountPaisa: parseTakaInput(amount), description: "Relay transfer" };
                  const res = await confirmTransferAction(body);
                  if (!res.ok) return push(res.error, "error");
                  setReceipt(res.data as Record<string, unknown>);
                  setStep("done");
                  push("Payment sent!");
                })
              }
            >
              Confirm & pay
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "done" && receipt && (
        <Card>
          <CardHeader><CardTitle>Receipt</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Reference: <strong>{String(receipt.reference)}</strong></p>
            <p>Amount: {formatPaisa(String(receipt.amountPaisa))}</p>
            <Link href={`/send/receipt/${receipt.id}`} className="text-blue-600">View details</Link>
            <Button className="w-full mt-3" onClick={() => { setStep("search"); setReceipt(null); setQuote(null); }}>
              Send again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
