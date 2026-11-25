import { notFound, redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { listClients } from "@/features/clients/data/clients";
import { EditQuoteForm } from "@/features/quotes/components/edit-quote-form";
import { getQuoteById } from "@/features/quotes/data/quotes";
import { isQuoteLocked } from "@/features/quotes/domain/status";

export const metadata = {
  title: "Edit quote — QuoteFlow",
};

export const dynamic = "force-dynamic";

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

function centsToEuroInputValue(cents: number): string {
  if (!Number.isFinite(cents)) {
    return "0";
  }
  const absolute = Math.abs(cents);
  const whole = Math.trunc(absolute / 100);
  const remainder = absolute - whole * 100;
  const sign = cents < 0 ? "-" : "";
  return `${sign}${whole}.${remainder.toString().padStart(2, "0")}`;
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const result = await getQuoteById(id);

  if (!result.ok && result.error === "not_found") {
    notFound();
  }

  if (!result.ok) {
    return (
      <>
        <BackLink href="/quotes">Back to quotes</BackLink>
        <Alert tone="error">
          We could not load this quote. Please try again.
        </Alert>
      </>
    );
  }

  const quote = result.data;

  if (isQuoteLocked(quote.status)) {
    redirect(`/quotes/${quote.id}`);
  }

  const clientsResult = await listClients();

  if (!clientsResult.ok) {
    return (
      <>
        <BackLink href={`/quotes/${quote.id}`}>Back to quote</BackLink>
        <Alert tone="error">
          We could not load your clients. Please try again.
        </Alert>
      </>
    );
  }

  return (
    <>
      <BackLink href={`/quotes/${quote.id}`}>Back to quote</BackLink>
      <PageHeader
        title="Edit quote"
        description="Update the client and line items for this quote."
      />
      <EditQuoteForm
        quoteId={quote.id}
        clients={clientsResult.data.map((client) => ({
          id: client.id,
          name: client.name,
        }))}
        initialValues={{
          clientId: quote.client_id,
          items: quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: centsToEuroInputValue(item.unit_price_cents),
          })),
        }}
      />
    </>
  );
}
