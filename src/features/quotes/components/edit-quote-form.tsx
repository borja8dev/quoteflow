"use client";

import { updateQuoteAction } from "@/features/quotes/actions";

import {
  QuoteForm,
  type QuoteFormClientOption,
  type QuoteFormInitialValues,
} from "./quote-form";

type EditQuoteFormProps = {
  quoteId: string;
  clients: ReadonlyArray<QuoteFormClientOption>;
  initialValues: QuoteFormInitialValues;
};

export function EditQuoteForm({
  quoteId,
  clients,
  initialValues,
}: EditQuoteFormProps) {
  const boundAction = updateQuoteAction.bind(null, quoteId);

  return (
    <QuoteForm
      action={boundAction}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      cancelHref={`/quotes/${quoteId}`}
      clients={clients}
      initialValues={initialValues}
    />
  );
}
