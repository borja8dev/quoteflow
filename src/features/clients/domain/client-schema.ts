import { z } from "zod";

import {
  normalizeTaxId,
  validateSpanishTaxId,
} from "./tax-id";

/**
 * Zod schema for a client form (BIZ-06, BIZ-07). The schema is pure: it does
 * not import React, Supabase or Next.js. Server Actions parse incoming
 * FormData with this schema before any database call (SEC-07).
 *
 * The `email` field accepts an empty string from HTML forms and normalises it
 * to `null`, since the database column is nullable. The `taxId` field is
 * trimmed, normalised and validated against the Spanish NIF/NIE/CIF rules via
 * `validateSpanishTaxId` (BIZ-06).
 */
export const clientInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(200, "Name must be 200 characters or fewer"),
    taxId: z
      .string()
      .trim()
      .min(1, "Tax ID is required"),
    email: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (value === null || value === undefined) {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
      }),
  })
  .superRefine((value, ctx) => {
    const taxIdResult = validateSpanishTaxId(value.taxId);
    if (!taxIdResult.ok) {
      const message =
        taxIdResult.error === "empty"
          ? "Tax ID is required"
          : "Enter a valid Spanish NIF, NIE or CIF";
      ctx.addIssue({
        code: "custom",
        path: ["taxId"],
        message,
      });
    }

    if (value.email !== null) {
      const emailResult = z.string().email().safeParse(value.email);
      if (!emailResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email address",
        });
      }
    }
  })
  .transform((value) => ({
    name: value.name,
    taxId: normalizeTaxId(value.taxId),
    email: value.email,
  }));

export type ClientInput = z.infer<typeof clientInputSchema>;
