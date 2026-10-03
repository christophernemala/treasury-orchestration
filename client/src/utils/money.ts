const MONEY_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

/**
 * Convert a decimal money value to integer minor units without IEEE 754
 * arithmetic. This keeps presentation calculations aligned with the server's
 * zero-float treasury invariant.
 */
export function toMinorUnits(value: string | number): bigint {
  const normalized = typeof value === "number" ? value.toFixed(2) : value.trim();

  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error("INVALID_MONEY_VALUE");
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));

  return negative ? -minor : minor;
}

export function fromMinorUnits(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

export function sumMoney(values: Array<string | number>): string {
  return fromMinorUnits(values.reduce<bigint>((total, value) => total + toMinorUnits(value), 0n));
}

export function formatMoney(value: string | number, currency = "AED"): string {
  try {
    const normalized = fromMinorUnits(toMinorUnits(value));
    const negative = normalized.startsWith("-");
    const unsigned = negative ? normalized.slice(1) : normalized;
    const [whole, fraction] = unsigned.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return `${currency} ${negative ? "-" : ""}${grouped}.${fraction}`;
  } catch {
    return `${currency} 0.00`;
  }
}
