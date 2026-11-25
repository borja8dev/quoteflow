"use client";

import { useActionState } from "react";

import {
  deleteClientAction,
  type ClientActionResult,
} from "@/features/clients/actions";

type DeleteClientButtonProps = {
  clientId: string;
  clientName: string;
};

export function DeleteClientButton({
  clientId,
  clientName,
}: DeleteClientButtonProps) {
  const [state, formAction, isPending] = useActionState<
    ClientActionResult | null,
    FormData
  >(deleteClientAction, null);

  const errorMessage = state && !state.ok ? state.error : undefined;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={clientId} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={`Delete client ${clientName}`}
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
