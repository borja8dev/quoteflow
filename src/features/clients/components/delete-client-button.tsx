"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (typeof window === "undefined") {
      return;
    }
    const confirmed = window.confirm(
      `Delete client "${clientName}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col items-start gap-1"
    >
      <input type="hidden" name="id" value={clientId} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={isPending}
        aria-label={`Delete client ${clientName}`}
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
