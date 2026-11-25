import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { CreateClientForm } from "@/features/clients/components/create-client-form";

export const metadata = {
  title: "New client — QuoteFlow",
};

export default function NewClientPage() {
  return (
    <>
      <BackLink href="/clients">Back to clients</BackLink>
      <PageHeader title="New client" description="Add a client to quote for." />
      <CreateClientForm />
    </>
  );
}
