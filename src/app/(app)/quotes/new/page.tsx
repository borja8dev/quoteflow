import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listClients } from "@/features/clients/data/clients";
import { CreateQuoteForm } from "@/features/quotes/components/create-quote-form";

export const metadata = {
  title: "New quote — QuoteFlow",
};

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const clientsResult = await listClients();

  return (
    <>
      <BackLink href="/quotes">Back to quotes</BackLink>
      <PageHeader
        title="New quote"
        description="Draft a quote for one of your clients."
      />

      {!clientsResult.ok ? (
        <Alert tone="error">
          We could not load your clients. Please try again.
        </Alert>
      ) : clientsResult.data.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 text-sm text-slate-700">
          <p>You need at least one client before you can draft a quote.</p>
          <Link href="/clients/new">
            <Button variant="primary">Create a client</Button>
          </Link>
        </Card>
      ) : (
        <CreateQuoteForm
          clients={clientsResult.data.map((client) => ({
            id: client.id,
            name: client.name,
          }))}
        />
      )}
    </>
  );
}
