import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteClientButton } from "@/features/clients/components/delete-client-button";
import { listClients } from "@/features/clients/data/clients";

export const metadata = {
  title: "Clients — QuoteFlow",
};

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const result = await listClients();

  return (
    <>
      <PageHeader
        title="Clients"
        description="People and companies you quote for."
        actions={
          <Link href="/clients/new">
            <Button variant="primary" size="sm">
              New client
            </Button>
          </Link>
        }
      />

      {!result.ok ? (
        <Alert tone="error">{result.error}</Alert>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="You have no clients yet."
          description="Create your first client to start building quotes."
          action={
            <Link href="/clients/new">
              <Button variant="primary">Create client</Button>
            </Link>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {result.data.map((client) => (
              <li key={client.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {client.name}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {client.tax_id}
                      {client.email ? ` · ${client.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <DeleteClientButton
                      clientId={client.id}
                      clientName={client.name}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Card className="overflow-hidden p-0">
              <table
                className="w-full border-collapse text-sm"
                aria-label="Clients"
              >
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Tax ID
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Email
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.data.map((client) => (
                    <tr key={client.id} className="align-middle">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {client.tax_id}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {client.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/clients/${client.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <DeleteClientButton
                            clientId={client.id}
                            clientName={client.name}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
