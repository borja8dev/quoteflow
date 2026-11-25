import Link from "next/link";

import { DeleteQuoteButton } from "@/features/quotes/components/delete-quote-button";
import { listQuotes } from "@/features/quotes/data/quotes";
import { formatCentsAsEuros } from "@/features/quotes/domain/format";
import { isQuoteLocked, type QuoteStatus } from "@/features/quotes/domain/status";

export const metadata = {
  title: "Quotes — QuoteFlow",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASSES: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  sent: "bg-blue-50 text-blue-800 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default async function QuotesPage() {
  const result = await listQuotes();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Quotes
          </h1>
          <p className="text-sm text-gray-600">
            Quotes you have drafted, sent or closed.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          New quote
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
          <p className="text-sm text-gray-600">You have no quotes yet.</p>
          <p className="mt-1 text-sm text-gray-600">
            Create your first quote to start tracking your work.
          </p>
          <Link
            href="/quotes/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Create quote
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.data.map((quote) => {
            const locked = isQuoteLocked(quote.status);
            const label = `${quote.client_name} quote`;
            return (
              <li
                key={quote.id}
                className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="truncate text-base font-semibold text-gray-900 hover:underline"
                    >
                      {quote.client_name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Total {formatCentsAsEuros(quote.total_cents)}
                    </p>
                  </div>
                  <StatusBadge status={quote.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    View
                  </Link>
                  {locked ? null : (
                    <>
                      <Link
                        href={`/quotes/${quote.id}/edit`}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <DeleteQuoteButton
                        quoteId={quote.id}
                        quoteLabel={label}
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
