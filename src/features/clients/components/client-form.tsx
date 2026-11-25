"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  type ClientActionResult,
} from "@/features/clients/actions";

export type ClientFormInitialValues = {
  name: string;
  taxId: string;
  email: string;
};

type ClientFormAction = (
  previousState: ClientActionResult | null,
  formData: FormData,
) => Promise<ClientActionResult>;

type ClientFormProps = {
  action: ClientFormAction;
  submitLabel: string;
  pendingLabel: string;
  initialValues?: ClientFormInitialValues;
};

export function ClientForm({
  action,
  submitLabel,
  pendingLabel,
  initialValues,
}: ClientFormProps) {
  const [state, formAction, isPending] = useActionState<
    ClientActionResult | null,
    FormData
  >(action, null);

  const nameError = state && !state.ok ? state.fieldErrors?.name : undefined;
  const taxIdError = state && !state.ok ? state.fieldErrors?.taxId : undefined;
  const emailError = state && !state.ok ? state.fieldErrors?.email : undefined;
  const generalError =
    state && !state.ok && !state.fieldErrors ? state.error : undefined;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-900">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="organization"
          required
          defaultValue={initialValues?.name ?? ""}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {nameError ? (
          <p id="name-error" className="text-sm text-red-600">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="taxId" className="text-sm font-medium text-gray-900">
          Tax ID (NIF / NIE / CIF)
        </label>
        <input
          id="taxId"
          name="taxId"
          type="text"
          autoComplete="off"
          required
          defaultValue={initialValues?.taxId ?? ""}
          aria-invalid={taxIdError ? true : undefined}
          aria-describedby={taxIdError ? "taxId-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base uppercase text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {taxIdError ? (
          <p id="taxId-error" className="text-sm text-red-600">
            {taxIdError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={initialValues?.email ?? ""}
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

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/clients"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
