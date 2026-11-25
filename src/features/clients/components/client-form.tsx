"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <Input
        id="name"
        name="name"
        type="text"
        autoComplete="organization"
        required
        defaultValue={initialValues?.name ?? ""}
        label="Name"
        error={nameError}
      />

      <Input
        id="taxId"
        name="taxId"
        type="text"
        autoComplete="off"
        required
        defaultValue={initialValues?.taxId ?? ""}
        label="Tax ID (NIF / NIE / CIF)"
        className="uppercase"
        error={taxIdError}
      />

      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={initialValues?.email ?? ""}
        label="Email"
        labelSuffix="(optional)"
        error={emailError}
      />

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/clients">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
