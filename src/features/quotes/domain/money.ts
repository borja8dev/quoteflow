/**
 * Pure money utilities for QuoteFlow.
 *
 * All amounts flow through the system as integer cents (BIZ-01).
 * Rounding follows half-up at the cent (BIZ-02).
 *
 * This module is intentionally free of React, Supabase, or Next.js imports.
 */

export const VAT_RATE_PERCENT = 21;

export type QuoteLineInput = {
  readonly quantity: number;
  readonly unitPriceCents: number;
};

export type QuoteLineTotals = {
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly lineTotalCents: number;
};

export type QuoteTotals = {
  readonly lines: readonly QuoteLineTotals[];
  readonly subtotalCents: number;
  readonly vatCents: number;
  readonly totalCents: number;
};

export type QuoteTotalsErrorCode =
  | "quantity_not_finite"
  | "quantity_not_positive"
  | "unit_price_not_finite"
  | "unit_price_not_integer"
  | "unit_price_negative";

export class QuoteTotalsError extends Error {
  readonly code: QuoteTotalsErrorCode;
  readonly lineIndex: number;

  constructor(code: QuoteTotalsErrorCode, lineIndex: number, message: string) {
    super(message);
    this.name = "QuoteTotalsError";
    this.code = code;
    this.lineIndex = lineIndex;
  }
}

/**
 * Round a possibly fractional cent amount to an integer number of cents using
 * half-up rounding (away from zero at the midpoint).
 *
 * Examples:
 *   roundHalfUpToCent(10.5)  -> 11
 *   roundHalfUpToCent(10.4)  -> 10
 *   roundHalfUpToCent(-10.5) -> -11
 */
export function roundHalfUpToCent(valueInCents: number): number {
  if (!Number.isFinite(valueInCents)) {
    throw new RangeError("roundHalfUpToCent requires a finite number");
  }
  if (valueInCents >= 0) {
    return Math.floor(valueInCents + 0.5);
  }
  return -Math.floor(-valueInCents + 0.5);
}

/**
 * Compute the line total in integer cents (quantity × unit price).
 *
 * Quantity may be fractional (e.g. hours, kilograms); unit price is already
 * expressed in integer cents. The product is rounded half-up at the cent.
 */
export function computeLineTotalCents(line: QuoteLineInput, lineIndex = 0): number {
  if (!Number.isFinite(line.quantity)) {
    throw new QuoteTotalsError(
      "quantity_not_finite",
      lineIndex,
      "Quantity must be a finite number",
    );
  }
  if (line.quantity <= 0) {
    throw new QuoteTotalsError(
      "quantity_not_positive",
      lineIndex,
      "Quantity must be greater than zero",
    );
  }
  if (!Number.isFinite(line.unitPriceCents)) {
    throw new QuoteTotalsError(
      "unit_price_not_finite",
      lineIndex,
      "Unit price must be a finite number of cents",
    );
  }
  if (!Number.isInteger(line.unitPriceCents)) {
    throw new QuoteTotalsError(
      "unit_price_not_integer",
      lineIndex,
      "Unit price must be an integer number of cents",
    );
  }
  if (line.unitPriceCents < 0) {
    throw new QuoteTotalsError(
      "unit_price_negative",
      lineIndex,
      "Unit price must be greater than or equal to zero",
    );
  }

  return roundHalfUpToCent(line.quantity * line.unitPriceCents);
}

/**
 * Compute subtotal, VAT (21%) and total in integer cents, along with the
 * per-line totals. VAT is rounded half-up at the cent; subtotal and total are
 * exact sums of integer cents.
 *
 * An empty line list produces zeroed totals (useful for drafts); the "at least
 * one line to send" rule is enforced at the status boundary (see
 * `src/features/quotes/domain/status.ts`).
 */
export function computeQuoteTotals(lines: readonly QuoteLineInput[]): QuoteTotals {
  const lineTotals: QuoteLineTotals[] = lines.map((line, index) => ({
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: computeLineTotalCents(line, index),
  }));

  const subtotalCents = lineTotals.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const vatCents = roundHalfUpToCent((subtotalCents * VAT_RATE_PERCENT) / 100);
  const totalCents = subtotalCents + vatCents;

  return {
    lines: lineTotals,
    subtotalCents,
    vatCents,
    totalCents,
  };
}
