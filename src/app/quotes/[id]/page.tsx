import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteQuoteButton } from "@/features/quotes/components/delete-quote-button";
import { StatusTransitionButtons } from "@/features/quotes/components/status-transition-buttons";
import { getQuoteById } from "@/features/quotes/data/quotes";
import { formatCentsAsEuros } from "@/features/quotes/domain/format";
import { computeQuoteTotals } from "@/features/quotes/domain/money";
import { isQuoteLocked, type QuoteStatus } from "@/features/quotes/domain/status";

export const metadata = {
  title: "Quote — QuoteFlow",
};

export const dynamic = "force-dynamic";

type QuotePageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function QuoteDetailPage({ params }: QuotePageProps) {
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
  const locked = isQuoteLocked(quote.status);
  const totals = computeQuoteTotals(
    quote.items.map((item) => ({
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link href="/quotes" className="text-gray-600 hover:text-gray-900">
          &larr; Back to quotes
        </Link>
      </nav>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
            {quote.client_name}
          </h1>
          <p className="text-sm text-gray-600">
            Quote total {formatCentsAsEuros(totals.totalCents)}
          </p>
        </div>
        <StatusBadge status={quote.status} />
      </header>

      {locked ? (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          This quote has been accepted and is locked. It can no longer be
          edited or deleted.
        </section>
      ) : null}

      <section
        aria-label="Line items"
        className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-gray-900">Line items</h2>
        {quote.items.length === 0 ? (
          <p className="text-sm text-gray-600">
            This quote has no line items yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-200">
            {quote.items.map((item, index) => {
              const lineTotal = totals.lines[index]?.lineTotalCents ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.quantity} × {formatCentsAsEuros(item.unit_price_cents)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 sm:text-right">
                    {formatCentsAsEuros(lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-label="Quote totals"
        className="flex flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatCentsAsEuros(totals.subtotalCents)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">VAT (21%)</span>
          <span className="font-medium text-gray-900">
            {formatCentsAsEuros(totals.vatCents)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-2">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-base font-semibold text-gray-900">
            {formatCentsAsEuros(totals.totalCents)}
          </span>
        </div>
      </section>

      <StatusTransitionButtons
        quoteId={quote.id}
        currentStatus={quote.status}
        lineItemCount={quote.items.length}
      />

      {locked ? null : (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteQuoteButton
            quoteId={quote.id}
            quoteLabel={`${quote.client_name} quote`}
          />
        </div>
      )}
    </main>
  );
}
