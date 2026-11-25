import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge, statusBadgeTone, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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

const TONE_ACCENT_CLASSES: Record<BadgeTone, string> = {
  gray: "border-t-4 border-t-slate-400",
  blue: "border-t-4 border-t-blue-500",
  green: "border-t-4 border-t-emerald-500",
  red: "border-t-4 border-t-red-500",
};

export default async function DashboardPage() {
  const result = await getDashboardStats();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick look at your quotes."
      />

      {!result.ok ? (
        <Alert tone="error">{result.error}</Alert>
      ) : result.data.quoteCount === 0 ? (
        <EmptyState
          title="You have no quotes yet."
          description="Create your first quote to see your dashboard come to life."
          action={
            <Link href="/quotes/new">
              <Button variant="primary">Create quote</Button>
            </Link>
          }
        />
      ) : (
        <>
          <section
            aria-label="Quote summary"
            className="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {QUOTE_STATUSES.map((status) => {
              const tone = statusBadgeTone(status);
              return (
                <Card
                  key={status}
                  className={`flex flex-col gap-2 ${TONE_ACCENT_CLASSES[tone]}`}
                >
                  <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>
                  <p className="text-3xl font-semibold tabular-nums text-slate-900">
                    {result.data.countsByStatus[status]}
                  </p>
                </Card>
              );
            })}
          </section>
          <Card className="flex flex-col gap-2 border-t-4 border-t-emerald-500">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              Total accepted
            </p>
            <p className="text-3xl font-semibold tabular-nums text-emerald-900">
              {formatCentsAsEuros(result.data.acceptedTotalCents)}
            </p>
          </Card>
        </>
      )}
    </>
  );
}
