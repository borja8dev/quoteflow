import Link from "next/link";

import { DeleteClientButton } from "@/features/clients/components/delete-client-button";
import { listClients } from "@/features/clients/data/clients";

export const metadata = {
  title: "Clients — QuoteFlow",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const result = await listClients();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Clients
          </h1>
          <p className="text-sm text-gray-600">
            People and companies you quote for.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          New client
        </Link>
      </header>

      {!result.ok ? (
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {result.error}
        </section>
      ) : result.data.length === 0 ? (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">
            You have no clients yet.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Create your first client to start building quotes.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Create client
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.data.map((client) => (
            <li
              key={client.id}
              className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate text-base font-semibold text-gray-900">
                  {client.name}
                </p>
                <p className="truncate text-sm text-gray-600">
                  {client.tax_id}
                  {client.email ? ` · ${client.email}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                >
                  Edit
                </Link>
                <DeleteClientButton
                  clientId={client.id}
                  clientName={client.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
