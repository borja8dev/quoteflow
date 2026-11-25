import { z } from "zod";

/**
 * Zod schema for the login form. Server Actions parse incoming FormData with
 * this before any Supabase call (SEC-07).
 */
export const loginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
