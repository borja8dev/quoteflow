import Link from "next/link";

import { listClients } from "@/features/clients/data/clients";
import { CreateQuoteForm } from "@/features/quotes/components/create-quote-form";

export const metadata = {
  title: "New quote — QuoteFlow",
};

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const clientsResult = await listClients();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
          &larr; Back to quotes
        </Link>
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          New quote
        </h1>
        <p className="text-sm text-gray-600">
          Draft a quote for one of your clients.
        </p>
      </header>

      {!clientsResult.ok ? (
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          We could not load your clients. Please try again.
        </section>
      ) : clientsResult.data.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-700">
          <p>You need at least one client before you can draft a quote.</p>
          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Create a client
          </Link>
        </section>
      ) : (
        <CreateQuoteForm
          clients={clientsResult.data.map((client) => ({
            id: client.id,
            name: client.name,
          }))}
        />
      )}
    </main>
  );
}
