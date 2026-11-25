import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge, statusBadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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

export default async function QuotesPage() {
  const result = await listQuotes();

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Quotes you have drafted, sent or closed."
        actions={
          <Link href="/quotes/new">
            <Button variant="primary" size="sm">
              New quote
            </Button>
          </Link>
        }
      />

      {!result.ok ? (
        <Alert tone="error">{result.error}</Alert>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="You have no quotes yet."
          description="Create your first quote to start tracking your work."
          action={
            <Link href="/quotes/new">
              <Button variant="primary">Create quote</Button>
            </Link>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {result.data.map((quote) => {
              const locked = isQuoteLocked(quote.status);
              const label = `${quote.client_name} quote`;
              return (
                <li key={quote.id}>
                  <Card className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="truncate rounded-md text-base font-semibold text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          {quote.client_name}
                        </Link>
                        <p className="text-sm tabular-nums text-slate-600">
                          Total {formatCentsAsEuros(quote.total_cents)}
                        </p>
                      </div>
                      <Badge tone={statusBadgeTone(quote.status)}>
                        {STATUS_LABELS[quote.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/quotes/${quote.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {locked ? null : (
                        <>
                          <Link href={`/quotes/${quote.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <DeleteQuoteButton
                            quoteId={quote.id}
                            quoteLabel={label}
                          />
                        </>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block">
            <Card className="overflow-hidden p-0">
              <table
                className="w-full border-collapse text-sm"
                aria-label="Quotes"
              >
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Client
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.data.map((quote) => {
                    const locked = isQuoteLocked(quote.status);
                    const label = `${quote.client_name} quote`;
                    return (
                      <tr key={quote.id} className="align-middle">
                        <td className="px-4 py-3">
                          <Link
                            href={`/quotes/${quote.id}`}
                            className="rounded-md font-medium text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          >
                            {quote.client_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusBadgeTone(quote.status)}>
                            {STATUS_LABELS[quote.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                          {formatCentsAsEuros(quote.total_cents)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/quotes/${quote.id}`}>
                              <Button variant="secondary" size="sm">
                                View
                              </Button>
                            </Link>
                            {locked ? null : (
                              <>
                                <Link href={`/quotes/${quote.id}/edit`}>
                                  <Button variant="secondary" size="sm">
                                    Edit
                                  </Button>
                                </Link>
                                <DeleteQuoteButton
                                  quoteId={quote.id}
                                  quoteLabel={label}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
