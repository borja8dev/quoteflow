"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteQuoteAction,
  type QuoteActionResult,
} from "@/features/quotes/actions";

type DeleteQuoteButtonProps = {
  quoteId: string;
  quoteLabel: string;
};

export function DeleteQuoteButton({
  quoteId,
  quoteLabel,
}: DeleteQuoteButtonProps) {
  const [state, formAction, isPending] = useActionState<
    QuoteActionResult | null,
    FormData
  >(deleteQuoteAction, null);

  const errorMessage = state && !state.ok ? state.error : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (typeof window === "undefined") {
      return;
    }
    const confirmed = window.confirm(
      `Delete ${quoteLabel}? This action cannot be undone.`,
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
      <input type="hidden" name="id" value={quoteId} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={isPending}
        aria-label={`Delete quote ${quoteLabel}`}
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
