import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { getDashboardStats } from "@/features/dashboard/data/stats";
import { formatCentsAsEuros } from "@/features/quotes/domain/format";
import { QUOTE_STATUSES, type QuoteStatus } from "@/features/quotes/domain/status";

export const metadata = {
  title: "Dashboard — QuoteFlow",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_CARD_CLASSES: Record<QuoteStatus, string> = {
  draft: "border-gray-200 bg-white",
  sent: "border-blue-200 bg-blue-50",
  accepted: "border-emerald-200 bg-emerald-50",
  rejected: "border-red-200 bg-red-50",
};

export default async function DashboardPage() {
  const result = await getDashboardStats();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            QuoteFlow
          </h1>
          <p className="text-sm text-gray-600">
            A quick look at your quotes.
          </p>
        </div>
        <LogoutButton />
      </header>

      {!result.ok ? (
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {result.error}
        </section>
      ) : result.data.quoteCount === 0 ? (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">You have no quotes yet.</p>
          <p className="mt-1 text-sm text-gray-600">
            Create your first quote to see your dashboard come to life.
          </p>
          <Link
            href="/quotes/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Create quote
          </Link>
        </section>
      ) : (
        <section
          aria-label="Quote summary"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {QUOTE_STATUSES.map((status) => (
            <article
              key={status}
              className={`flex flex-col gap-1 rounded-md border p-4 shadow-sm ${STATUS_CARD_CLASSES[status]}`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                {STATUS_LABELS[status]}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {result.data.countsByStatus[status]}
              </p>
            </article>
          ))}
          <article className="col-span-2 flex flex-col gap-1 rounded-md border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:col-span-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              Total accepted
            </p>
            <p className="text-2xl font-semibold text-emerald-900">
              {formatCentsAsEuros(result.data.acceptedTotalCents)}
            </p>
          </article>
        </section>
      )}

      <nav aria-label="Primary" className="flex flex-col gap-2">
        <Link
          href="/clients"
          className="inline-flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span>Clients</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <Link
          href="/quotes"
          className="inline-flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span>Quotes</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </nav>
    </main>
  );
}
