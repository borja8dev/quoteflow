import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">QuoteFlow</h1>
          <p className="text-base text-gray-600">
            Quote manager for small businesses.
          </p>
        </div>
        <LogoutButton />
      </header>
      <nav className="flex flex-col gap-2">
        <Link
          href="/clients"
          className="inline-flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span>Clients</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <Link
          href="/quotes"
          className="inline-flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span>Quotes</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </nav>
    </main>
  );
}
