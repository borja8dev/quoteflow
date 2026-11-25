import { z } from "zod";

import { QUANTITY_MAX_DECIMALS, countDecimals, roundHalfUpToCent } from "./money";
import { isQuoteStatus, type QuoteStatus } from "./status";

/**
 * Zod schemas for quote forms.
 *
 * Pure module: no React, Supabase or Next.js imports. Server Actions parse
 * incoming FormData with these schemas before any database call (SEC-07).
 *
 * Input shape for prices
 * ----------------------
 * Users type prices in euros using either `.` or `,` as the decimal separator
 * (e.g. "10.50", "10,50", "10"). The schema accepts a string and converts it
 * to integer cents (BIZ-01) with half-up rounding at the cent (BIZ-02). Any
 * number of fractional digits is allowed in the input — rounding is explicit
 * and predictable.
 *
 * Quantity accepts up to two decimals (BIZ-03); any extra precision is
 * rejected by the schema and by the database.
 *
 * The at-least-one-line rule for `sent` status is NOT enforced here (a draft
 * is allowed to be saved with zero lines). It is enforced in the domain
 * transition in `status.ts` when moving `draft → sent`.
 */

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LINE_ITEMS = 500;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseQuantityString(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0) {
    return null;
  }
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function parseEuroStringToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0) {
    return null;
  }
  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) {
    return null;
  }

  const wholePart = match[1] ?? "0";
  const fractionPart = match[2] ?? "";
  const paddedFraction = (fractionPart + "00").slice(0, 2);
  const remainderDigits = fractionPart.slice(2);

  const wholeCents = Number.parseInt(wholePart, 10) * 100;
  const fractionCents = Number.parseInt(paddedFraction, 10);
  if (!Number.isFinite(wholeCents) || !Number.isFinite(fractionCents)) {
    return null;
  }

  const baseCents = wholeCents + fractionCents;
  if (remainderDigits.length === 0) {
    return roundHalfUpToCent(baseCents);
  }

  // Half-up rounding driven by the digit just past the cent: anything >= 5
  // pushes the amount up by one cent.
  const firstRemainder = Number.parseInt(remainderDigits[0] ?? "0", 10);
  const roundUp = firstRemainder >= 5;

  return roundHalfUpToCent(roundUp ? baseCents + 1 : baseCents);
}

/**
 * Line item schema: description + quantity (up to 2 decimals) + unit price
 * in euro string form converted to integer cents.
 */
export const quoteItemInputSchema = z
  .object({
    description: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
  })
  .superRefine((value, ctx) => {
    const trimmedDescription = value.description.trim();
    if (trimmedDescription.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      });
    } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,
      });
    }

    const quantity = parseQuantityString(value.quantity);
    if (quantity === null) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Enter a valid quantity",
      });
    } else if (quantity <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be greater than zero",
      });
    } else if (countDecimals(quantity) > QUANTITY_MAX_DECIMALS) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: `Quantity must have at most ${QUANTITY_MAX_DECIMALS} decimals`,
      });
    }

    const unitPriceCents = parseEuroStringToCents(value.unitPrice);
    if (unitPriceCents === null) {
      ctx.addIssue({
        code: "custom",
        path: ["unitPrice"],
        message: "Enter a valid unit price",
      });
    }
  })
  .transform((value) => {
    const quantity = parseQuantityString(value.quantity) as number;
    const unitPriceCents = parseEuroStringToCents(value.unitPrice) as number;
    return {
      description: value.description.trim(),
      quantity,
      unitPriceCents,
    };
  });

export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>;

/**
 * Full quote draft schema. `items` may be empty when saving a draft; the
 * "at least one line to send" rule lives in `transitionQuoteStatus`.
 */
export const quoteInputSchema = z
  .object({
    clientId: z.string(),
    items: z.array(quoteItemInputSchema).max(MAX_LINE_ITEMS),
  })
  .superRefine((value, ctx) => {
    if (!UUID_REGEX.test(value.clientId)) {
      ctx.addIssue({
        code: "custom",
        path: ["clientId"],
        message: "Choose a client",
      });
    }
  });

export type QuoteInput = z.infer<typeof quoteInputSchema>;

/**
 * Schema for the `nextStatus` form field on status change actions.
 */
export const statusChangeSchema = z
  .string()
  .refine((value): value is QuoteStatus => isQuoteStatus(value), {
    message: "Unknown status",
  });
