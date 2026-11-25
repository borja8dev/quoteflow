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
    </main>
  );
}
