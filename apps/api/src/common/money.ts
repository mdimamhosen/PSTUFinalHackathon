export const PAISA_PER_TAKA = 100n;
export const OPENING_BALANCE_PAISA = 10_000_000n;

export function paisaToString(value: bigint): string {
  return value.toString();
}

export function parsePaisa(raw: string): bigint {
  if (!/^[1-9]\d*$|^0$/.test(raw)) {
    throw new Error("INVALID_AMOUNT");
  }
  return BigInt(raw);
}

export function formatTaka(paisa: bigint): string {
  const negative = paisa < 0n;
  const abs = negative ? -paisa : paisa;
  const taka = abs / PAISA_PER_TAKA;
  const frac = abs % PAISA_PER_TAKA;
  const body = `${taka.toLocaleString("en-BD")}.${frac.toString().padStart(2, "0")}`;
  return `${negative ? "-" : ""}৳${body}`;
}
