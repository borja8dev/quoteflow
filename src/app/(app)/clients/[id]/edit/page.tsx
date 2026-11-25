import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { EditClientForm } from "@/features/clients/components/edit-client-form";
import { getClientById } from "@/features/clients/data/clients";

export const metadata = {
  title: "Edit client — QuoteFlow",
};

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const result = await getClientById(id);

  if (!result.ok && result.error === "not_found") {
    notFound();
  }

  if (!result.ok) {
    return (
      <>
        <BackLink href="/clients">Back to clients</BackLink>
        <Alert tone="error">
          We could not load this client. Please try again.
        </Alert>
      </>
    );
  }

  const client = result.data;

  return (
    <>
      <BackLink href="/clients">Back to clients</BackLink>
      <PageHeader
        title="Edit client"
        description="Update this client's details."
      />
      <EditClientForm
        clientId={client.id}
        initialValues={{
          name: client.name,
          taxId: client.tax_id,
          email: client.email ?? "",
        }}
      />
    </>
  );
}
