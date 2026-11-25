import Link from "next/link";
import { notFound } from "next/navigation";

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
      <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
        <nav className="text-sm">
          <Link href="/clients" className="text-gray-600 hover:text-gray-900">
            &larr; Back to clients
          </Link>
        </nav>
        <section
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          We could not load this client. Please try again.
        </section>
      </main>
    );
  }

  const client = result.data;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link href="/clients" className="text-gray-600 hover:text-gray-900">
          &larr; Back to clients
        </Link>
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Edit client
        </h1>
        <p className="text-sm text-gray-600">
          Update this client&apos;s details.
        </p>
      </header>
      <EditClientForm
        clientId={client.id}
        initialValues={{
          name: client.name,
          taxId: client.tax_id,
          email: client.email ?? "",
        }}
      />
    </main>
  );
}
