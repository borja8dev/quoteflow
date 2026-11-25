import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { Badge, statusBadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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

export default async function QuoteDetailPage({ params }: QuotePageProps) {
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
  const locked = isQuoteLocked(quote.status);
  const totals = computeQuoteTotals(
    quote.items.map((item) => ({
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
  );

  return (
    <>
      <BackLink href="/quotes">Back to quotes</BackLink>

      <PageHeader
        title={quote.client_name}
        description={`Quote total ${formatCentsAsEuros(totals.totalCents)}`}
        actions={
          <Badge tone={statusBadgeTone(quote.status)}>
            {STATUS_LABELS[quote.status]}
          </Badge>
        }
      />

      {locked ? (
        <Alert tone="success">
          This quote has been accepted and is locked. It can no longer be
          edited or deleted.
        </Alert>
      ) : null}

      <Card aria-label="Line items" className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900">Line items</h2>
        {quote.items.length === 0 ? (
          <p className="text-sm text-slate-600">
            This quote has no line items yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-200">
            {quote.items.map((item, index) => {
              const lineTotal = totals.lines[index]?.lineTotalCents ?? 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.description}
                    </p>
                    <p className="text-xs tabular-nums text-slate-600">
                      {item.quantity} × {formatCentsAsEuros(item.unit_price_cents)}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums text-slate-900 sm:text-right">
                    {formatCentsAsEuros(lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card
        aria-label="Quote totals"
        className="flex flex-col gap-1 bg-slate-50 text-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.subtotalCents)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">VAT (21%)</span>
          <span className="font-medium tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.vatCents)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-base font-semibold tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.totalCents)}
          </span>
        </div>
      </Card>

      <StatusTransitionButtons
        quoteId={quote.id}
        currentStatus={quote.status}
        lineItemCount={quote.items.length}
      />

      {locked ? null : (
        <div className="flex flex-wrap gap-2">
          <Link href={`/quotes/${quote.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <DeleteQuoteButton
            quoteId={quote.id}
            quoteLabel={`${quote.client_name} quote`}
          />
        </div>
      )}
    </>
  );
}
