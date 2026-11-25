"use client";

import { createQuoteAction } from "@/features/quotes/actions";

import { QuoteForm, type QuoteFormClientOption } from "./quote-form";

type CreateQuoteFormProps = {
  clients: ReadonlyArray<QuoteFormClientOption>;
};

export function CreateQuoteForm({ clients }: CreateQuoteFormProps) {
  return (
    <QuoteForm
      action={createQuoteAction}
      submitLabel="Create quote"
      pendingLabel="Creating…"
      cancelHref="/quotes"
      clients={clients}
    />
  );
}
