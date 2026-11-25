"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginAction,
  type LoginActionResult,
} from "@/features/auth/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    LoginActionResult | null,
    FormData
  >(loginAction, null);

  const emailError =
    state && !state.ok ? state.fieldErrors?.email : undefined;
  const passwordError =
    state && !state.ok ? state.fieldErrors?.password : undefined;
  const generalError =
    state && !state.ok && !state.fieldErrors ? state.error : undefined;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        label="Email"
        error={emailError}
      />

      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label="Password"
        error={passwordError}
      />

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="mt-2 w-full"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
