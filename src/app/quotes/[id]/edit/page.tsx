import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
      <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
        <nav className="text-sm">
          <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
            &larr; Back to quotes
          </Link>
        </nav>
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          We could not load this quote. Please try again.
        </section>
      </main>
    );
  }

  const quote = result.data;

  if (isQuoteLocked(quote.status)) {
    redirect(`/quotes/${quote.id}`);
  }

  const clientsResult = await listClients();

  if (!clientsResult.ok) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
        <nav className="text-sm">
          <Link
            href={`/quotes/${quote.id}`}
            className="text-gray-600 hover:text-gray-900"
          >
            &larr; Back to quote
          </Link>
        </nav>
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          We could not load your clients. Please try again.
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link
          href={`/quotes/${quote.id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to quote
        </Link>
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Edit quote
        </h1>
        <p className="text-sm text-gray-600">
          Update the client and line items for this quote.
        </p>
      </header>
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
    </main>
  );
}
