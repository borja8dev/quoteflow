"use client";

import { useActionState } from "react";

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

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={quoteId} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={`Delete quote ${quoteLabel}`}
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
