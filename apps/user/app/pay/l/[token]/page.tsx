import { resolvePayAction } from "@/lib/actions";
import { SendFlow } from "@/components/send-flow";

export default async function PayLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await resolvePayAction({ paymentLinkToken: token });
  if (!res.ok) return <div className="p-8 text-center text-red-600">{res.error}</div>;
  const data = res.data as { amountPaisa?: string };
  const preset: Record<string, string> = { paymentLinkToken: token };
  if (data.amountPaisa) preset.amountPaisa = String(data.amountPaisa);
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">Pay via link</h1>
      <SendFlow preset={preset} />
    </div>
  );
}
