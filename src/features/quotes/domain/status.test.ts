import { describe, expect, it } from "vitest";

import {
  QUOTE_STATUSES,
  type QuoteStatus,
  canTransition,
  isQuoteLocked,
  isQuoteStatus,
  transitionQuoteStatus,
} from "./status";

const ALLOWED: ReadonlyArray<readonly [QuoteStatus, QuoteStatus]> = [
  ["draft", "sent"],
  ["sent", "accepted"],
  ["sent", "rejected"],
  ["sent", "draft"],
];

describe("isQuoteStatus", () => {
  it("accepts every status in the enum", () => {
    for (const status of QUOTE_STATUSES) {
      expect(isQuoteStatus(status)).toBe(true);
    }
  });

  it("rejects strings outside the enum", () => {
    expect(isQuoteStatus("archived")).toBe(false);
    expect(isQuoteStatus("")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isQuoteStatus(1)).toBe(false);
    expect(isQuoteStatus(null)).toBe(false);
    expect(isQuoteStatus(undefined)).toBe(false);
    expect(isQuoteStatus({})).toBe(false);
  });
});

describe("canTransition", () => {
  it("returns true for every allowed transition", () => {
    for (const [from, to] of ALLOWED) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it("rejects every other pair of statuses, including same-state transitions", () => {
    for (const from of QUOTE_STATUSES) {
      for (const to of QUOTE_STATUSES) {
        const allowed = ALLOWED.some(([f, t]) => f === from && t === to);
        if (!allowed) {
          expect(canTransition(from, to)).toBe(false);
        }
      }
    }
  });
});

describe("transitionQuoteStatus", () => {
  it("accepts draft → sent when the quote has line items", () => {
    const result = transitionQuoteStatus("draft", "sent", { lineItemCount: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.next).toBe("sent");
    }
  });

  it("rejects draft → sent when the quote has no line items", () => {
    const result = transitionQuoteStatus("draft", "sent", { lineItemCount: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("quote_has_no_lines");
    }
  });

  it("rejects draft → sent when lineItemCount is omitted", () => {
    const result = transitionQuoteStatus("draft", "sent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("quote_has_no_lines");
    }
  });

  it("accepts sent → accepted, sent → rejected and sent → draft", () => {
    for (const next of ["accepted", "rejected", "draft"] as const) {
      const result = transitionQuoteStatus("sent", next);
      expect(result.ok).toBe(true);
    }
  });

  it("rejects every transition out of accepted (BIZ-05 lock)", () => {
    for (const next of QUOTE_STATUSES) {
      const result = transitionQuoteStatus("accepted", next);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("accepted_is_locked");
      }
    }
  });

  it("rejects transitions from rejected to anything else", () => {
    for (const next of QUOTE_STATUSES) {
      const result = transitionQuoteStatus("rejected", next);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("forbidden_transition");
      }
    }
  });

  it("rejects draft → accepted and draft → rejected directly", () => {
    for (const next of ["accepted", "rejected"] as const) {
      const result = transitionQuoteStatus("draft", next, { lineItemCount: 3 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("forbidden_transition");
      }
    }
  });

  it("rejects same-state transitions", () => {
    for (const status of QUOTE_STATUSES) {
      const result = transitionQuoteStatus(status, status);
      expect(result.ok).toBe(false);
    }
  });

  it("rejects unknown statuses at the boundary", () => {
    const unsafeCast = (value: string): QuoteStatus => value as QuoteStatus;
    const result = transitionQuoteStatus(unsafeCast("archived"), "sent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unknown_status");
    }
  });
});

describe("isQuoteLocked", () => {
  it("locks only the accepted status", () => {
    expect(isQuoteLocked("accepted")).toBe(true);
    expect(isQuoteLocked("draft")).toBe(false);
    expect(isQuoteLocked("sent")).toBe(false);
    expect(isQuoteLocked("rejected")).toBe(false);
  });
});
