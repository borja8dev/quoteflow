import { describe, it, expect } from "vitest";

import { loginCredentialsSchema } from "./credentials";

describe("loginCredentialsSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "a-strong-password",
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace in the email", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "  user@example.com  ",
      password: "a-strong-password",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects a missing email", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "",
      password: "a-strong-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) =>
        issue.path.includes("email"),
      );
      expect(emailIssue?.message).toBe("Email is required");
    }
  });

  it("rejects an invalid email format", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "not-an-email",
      password: "a-strong-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) =>
        issue.path.includes("email"),
      );
      expect(emailIssue?.message).toBe("Enter a valid email address");
    }
  });

  it("rejects a missing password", () => {
    const result = loginCredentialsSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) =>
        issue.path.includes("password"),
      );
      expect(passwordIssue?.message).toBe("Password is required");
    }
  });
});
