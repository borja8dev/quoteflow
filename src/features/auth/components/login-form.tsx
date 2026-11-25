"use client";

import { useActionState } from "react";

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
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {emailError ? (
          <p id="email-error" className="text-sm text-red-600">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-gray-900"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {passwordError ? (
          <p id="password-error" className="text-sm text-red-600">
            {passwordError}
          </p>
        ) : null}
      </div>

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
