import { describe, expect, it } from "vitest";

import { clientInputSchema } from "./client-schema";

describe("clientInputSchema", () => {
  it("accepts valid input and normalises the tax ID", () => {
    const result = clientInputSchema.safeParse({
      name: "  Acme S.L.  ",
      taxId: " a-58818501 ",
      email: " person@example.com ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Acme S.L.",
        taxId: "A58818501",
        email: "person@example.com",
      });
    }
  });

  it("accepts input without an email (undefined)", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "12345678Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("stores an empty email string as null", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "12345678Z",
      email: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("stores a whitespace-only email as null", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "12345678Z",
      email: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("rejects an empty name with a field error", () => {
    const result = clientInputSchema.safeParse({
      name: "",
      taxId: "12345678Z",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find(
        (issue) => issue.path[0] === "name",
      );
      expect(nameIssue).toBeDefined();
    }
  });

  it("rejects a whitespace-only name with a field error", () => {
    const result = clientInputSchema.safeParse({
      name: "   ",
      taxId: "12345678Z",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find(
        (issue) => issue.path[0] === "name",
      );
      expect(nameIssue).toBeDefined();
    }
  });

  it("rejects a name longer than 200 characters", () => {
    const result = clientInputSchema.safeParse({
      name: "a".repeat(201),
      taxId: "12345678Z",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find(
        (issue) => issue.path[0] === "name",
      );
      expect(nameIssue).toBeDefined();
    }
  });

  it("rejects an invalid NIF", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "12345678A",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const taxIdIssue = result.error.issues.find(
        (issue) => issue.path[0] === "taxId",
      );
      expect(taxIdIssue).toBeDefined();
    }
  });

  it("rejects an invalid NIE (wrong control letter)", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "X1234567A",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const taxIdIssue = result.error.issues.find(
        (issue) => issue.path[0] === "taxId",
      );
      expect(taxIdIssue).toBeDefined();
    }
  });

  it("rejects an invalid CIF", () => {
    const result = clientInputSchema.safeParse({
      name: "Acme",
      taxId: "A58818502",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const taxIdIssue = result.error.issues.find(
        (issue) => issue.path[0] === "taxId",
      );
      expect(taxIdIssue).toBeDefined();
    }
  });

  it("rejects an empty tax ID with the required-message path", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "",
      email: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const taxIdIssue = result.error.issues.find(
        (issue) => issue.path[0] === "taxId",
      );
      expect(taxIdIssue).toBeDefined();
    }
  });

  it("rejects an invalid email format", () => {
    const result = clientInputSchema.safeParse({
      name: "Jane Doe",
      taxId: "12345678Z",
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find(
        (issue) => issue.path[0] === "email",
      );
      expect(emailIssue).toBeDefined();
    }
  });
});
