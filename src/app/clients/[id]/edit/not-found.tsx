import Link from "next/link";

export default function EditClientNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <nav className="text-sm">
        <Link href="/clients" className="text-gray-600 hover:text-gray-900">
          &larr; Back to clients
        </Link>
      </nav>
      <section className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-700">
        <h1 className="text-lg font-semibold text-gray-900">Client not found</h1>
        <p className="mt-2">
          This client does not exist or you do not have access to it.
        </p>
      </section>
    </main>
  );
}
