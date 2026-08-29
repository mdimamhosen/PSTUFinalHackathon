export function formatPaisa(paisa: string | number): string {
  const n = typeof paisa === "string" ? Number(paisa) : paisa;
  if (!Number.isFinite(n)) return "৳0.00";
  const taka = n / 100;
  return "৳" + taka.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function takaToPaisa(taka: string): string {
  const cleaned = taka.replace(/[^0-9.]/g, "");
  if (!cleaned) return "0";
  const parts = cleaned.split(".");
  const whole = parts[0] ?? "0";
  const frac = (parts[1] ?? "00").padEnd(2, "0").slice(0, 2);
  return String(Number(whole) * 100 + Number(frac));
}

export function parseTakaInput(value: string): string {
  return takaToPaisa(value);
}
