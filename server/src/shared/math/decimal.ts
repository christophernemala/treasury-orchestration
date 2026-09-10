/**
 * Exact decimal operations using integer cents/units to prevent IEEE 754 float drift.
 * All monetary amounts in Treasury Atom are represented as exact 2-decimal strings, e.g. "14800000.00"
 */

export function toCents(amount: string | number): bigint {
  if (typeof amount === "number") {
    amount = amount.toFixed(2);
  }
  const clean = String(amount).trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) {
    throw new Error(`Invalid decimal amount: ${amount}`);
  }
  const isNegative = clean.startsWith("-");
  const raw = isNegative ? clean.slice(1) : clean;
  const [whole, frac = ""] = raw.split(".");
  const paddedFrac = frac.padEnd(2, "0").slice(0, 2);
  const cents = BigInt(whole) * 100n + BigInt(paddedFrac);
  return isNegative ? -cents : cents;
}

export function fromCents(cents: bigint): string {
  const isNegative = cents < 0n;
  const abs = isNegative ? -cents : cents;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const paddedFrac = frac.toString().padStart(2, "0");
  return `${isNegative ? "-" : ""}${whole.toString()}.${paddedFrac}`;
}

export function decimalAdd(a: string | number, b: string | number): string {
  return fromCents(toCents(a) + toCents(b));
}

export function decimalSub(a: string | number, b: string | number): string {
  return fromCents(toCents(a) - toCents(b));
}

export function decimalCompare(a: string | number, b: string | number): number {
  const diff = toCents(a) - toCents(b);
  if (diff > 0n) return 1;
  if (diff < 0n) return -1;
  return 0;
}

export function decimalAbs(a: string | number): string {
  const c = toCents(a);
  return fromCents(c < 0n ? -c : c);
}

export function formatCurrency(amount: string | number, currency = "AED"): string {
  const cents = toCents(amount);
  const isNegative = cents < 0n;
  const abs = isNegative ? -cents : cents;
  const whole = (abs / 100n).toString();
  const frac = (abs % 100n).toString().padStart(2, "0");
  
  // Format whole part with commas
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${isNegative ? "-" : ""}${formattedWhole}.${frac}`;
}
