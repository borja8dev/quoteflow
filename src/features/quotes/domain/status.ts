/**
 * Quote status model and transition rules (BIZ-04, BIZ-05).
 *
 * Pure module: no React, Supabase or Next.js imports.
 */

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/**
 * Transitions explicitly allowed by BIZ-04. Everything else is rejected.
 */
const ALLOWED_TRANSITIONS: ReadonlyArray<readonly [QuoteStatus, QuoteStatus]> = [
  ["draft", "sent"],
  ["sent", "accepted"],
  ["sent", "rejected"],
  ["sent", "draft"],
];

export type TransitionErrorCode =
  | "unknown_status"
  | "forbidden_transition"
  | "accepted_is_locked"
  | "quote_has_no_lines";

export type TransitionResult =
  | { readonly ok: true; readonly next: QuoteStatus }
  | { readonly ok: false; readonly code: TransitionErrorCode; readonly message: string };

/**
 * Type guard for `QuoteStatus`. Useful at the IO boundary (database rows,
 * form submissions) before trusting a string.
 */
export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return (
    typeof value === "string" &&
    (QUOTE_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Return true if `next` is a valid successor of `current`.
 * Does not enforce the "at least one line to send" rule — use
 * `transitionQuoteStatus` for the full check.
 */
export function canTransition(current: QuoteStatus, next: QuoteStatus): boolean {
  return ALLOWED_TRANSITIONS.some(([from, to]) => from === current && to === next);
}

export type TransitionOptions = {
  /**
   * Current number of line items on the quote. Required when transitioning
   * `draft → sent` (BIZ-03). Omit for other transitions.
   */
  readonly lineItemCount?: number;
};

/**
 * Validate a status transition.
 *
 *  - Rejects unknown status values.
 *  - Rejects any transition that is not listed in BIZ-04.
 *  - Rejects any transition out of `accepted` (BIZ-05 lock; even "accepted →
 *    accepted" is a no-op that must not happen through this helper).
 *  - When transitioning `draft → sent`, requires at least one line item
 *    (BIZ-03).
 */
export function transitionQuoteStatus(
  current: QuoteStatus,
  next: QuoteStatus,
  options: TransitionOptions = {},
): TransitionResult {
  if (!isQuoteStatus(current) || !isQuoteStatus(next)) {
    return {
      ok: false,
      code: "unknown_status",
      message: "Unknown quote status",
    };
  }

  if (current === "accepted") {
    return {
      ok: false,
      code: "accepted_is_locked",
      message: "An accepted quote cannot change status",
    };
  }

  if (!canTransition(current, next)) {
    return {
      ok: false,
      code: "forbidden_transition",
      message: `Transition ${current} → ${next} is not allowed`,
    };
  }

  if (current === "draft" && next === "sent") {
    const count = options.lineItemCount ?? 0;
    if (count <= 0) {
      return {
        ok: false,
        code: "quote_has_no_lines",
        message: "A quote needs at least one line item before it can be sent",
      };
    }
  }

  return { ok: true, next };
}

/**
 * Convenience predicate for BIZ-05: an accepted quote is locked and must not
 * be edited or deleted.
 */
export function isQuoteLocked(status: QuoteStatus): boolean {
  return status === "accepted";
}
