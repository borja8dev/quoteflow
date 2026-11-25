"use server";

import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { loginCredentialsSchema } from "./domain/credentials";

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type LoginActionResult = ActionResult<undefined, LoginFieldErrors>;

/**
 * Signs the user in with email and password. All input is validated with Zod
 * before reaching Supabase (SEC-07). Supabase errors are turned into a
 * generic, user-safe message (ARCH-04).
 *
 * On success this function throws a Next.js redirect to `/` and never returns.
 */
export async function loginAction(
  _previousState: LoginActionResult | null,
  formData: FormData,
): Promise<LoginActionResult> {
  const parsed = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" && !fieldErrors.email) {
        fieldErrors.email = issue.message;
      }
      if (key === "password" && !fieldErrors.password) {
        fieldErrors.password = issue.message;
      }
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: "Invalid email or password.",
    };
  }

  redirect("/");
}

/**
 * Signs the user out and sends them back to `/login`. Called from a form
 * submission so it runs on the server as a Server Action.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
