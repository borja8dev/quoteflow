import Link from "next/link";

import { CreateClientForm } from "@/features/clients/components/create-client-form";

export const metadata = {
  title: "New client — QuoteFlow",
};

export default function NewClientPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link href="/clients" className="text-gray-600 hover:text-gray-900">
          &larr; Back to clients
        </Link>
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          New client
        </h1>
        <p className="text-sm text-gray-600">
          Add a client to quote for.
        </p>
      </header>
      <CreateClientForm />
    </main>
  );
}
