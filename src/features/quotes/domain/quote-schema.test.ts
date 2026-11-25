import { describe, expect, it } from "vitest";

import {
  quoteInputSchema,
  quoteItemInputSchema,
  statusChangeSchema,
} from "./quote-schema";

const VALID_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

describe("quoteItemInputSchema", () => {
  it("accepts a valid line and returns integer cents", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Consulting",
      quantity: "1.5",
      unitPrice: "100",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        description: "Consulting",
        quantity: 1.5,
        unitPriceCents: 10_000,
      });
    }
  });

  it("accepts comma as decimal separator in both quantity and price", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Hours",
      quantity: "1,5",
      unitPrice: "10,50",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1.5);
      expect(result.data.unitPriceCents).toBe(1050);
    }
  });

  it("rounds half-up at the cent when converting price to cents", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Odd price",
      quantity: "1",
      unitPrice: "1.005",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPriceCents).toBe(101);
    }
  });

  it("accepts a zero unit price", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Freebie",
      quantity: "1",
      unitPrice: "0",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPriceCents).toBe(0);
    }
  });

  it("rejects a quantity with 3 decimals", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Hours",
      quantity: "0.333",
      unitPrice: "100",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "quantity",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects a negative price", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Discount",
      quantity: "1",
      unitPrice: "-10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "unitPrice",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects an empty description", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "   ",
      quantity: "1",
      unitPrice: "10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "description",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects a description longer than 500 characters", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "a".repeat(501),
      quantity: "1",
      unitPrice: "10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "description",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects a zero quantity", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Hours",
      quantity: "0",
      unitPrice: "10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "quantity",
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects a non-numeric quantity", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Hours",
      quantity: "abc",
      unitPrice: "10",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    const result = quoteItemInputSchema.safeParse({
      description: "Hours",
      quantity: "1",
      unitPrice: "abc",
    });

    expect(result.success).toBe(false);
  });
});

describe("quoteInputSchema", () => {
  it("accepts a draft with an empty items list", () => {
    const result = quoteInputSchema.safeParse({
      clientId: VALID_CLIENT_ID,
      items: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([]);
    }
  });

  it("accepts a draft with multiple valid items", () => {
    const result = quoteInputSchema.safeParse({
      clientId: VALID_CLIENT_ID,
      items: [
        { description: "Design", quantity: "2", unitPrice: "50" },
        { description: "Dev", quantity: "1.5", unitPrice: "100" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items.length).toBe(2);
      expect(result.data.items[0]?.unitPriceCents).toBe(5000);
      expect(result.data.items[1]?.quantity).toBe(1.5);
    }
  });

  it("rejects an invalid client id", () => {
    const result = quoteInputSchema.safeParse({
      clientId: "not-a-uuid",
      items: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (entry) => entry.path[0] === "clientId",
      );
      expect(issue).toBeDefined();
    }
  });

  it("propagates per-item errors with the item index in the path", () => {
    const result = quoteInputSchema.safeParse({
      clientId: VALID_CLIENT_ID,
      items: [
        { description: "Design", quantity: "2", unitPrice: "50" },
        { description: "", quantity: "0", unitPrice: "-1" },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const descriptionIssue = result.error.issues.find(
        (entry) => entry.path[0] === "items" && entry.path[1] === 1 && entry.path[2] === "description",
      );
      expect(descriptionIssue).toBeDefined();
    }
  });
});

describe("statusChangeSchema", () => {
  it("accepts every QuoteStatus value", () => {
    for (const status of ["draft", "sent", "accepted", "rejected"] as const) {
      const result = statusChangeSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it("rejects unknown statuses", () => {
    expect(statusChangeSchema.safeParse("archived").success).toBe(false);
    expect(statusChangeSchema.safeParse("").success).toBe(false);
  });
});
