export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            QuoteFlow
          </h1>
          <p className="text-sm text-gray-600">Loading your dashboard…</p>
        </div>
      </header>
      <section
        aria-busy="true"
        aria-label="Quote summary"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[0, 1, 2, 3].map((placeholder) => (
          <div
            key={placeholder}
            className="h-20 animate-pulse rounded-md border border-gray-200 bg-gray-50"
          />
        ))}
        <div className="col-span-2 h-20 animate-pulse rounded-md border border-gray-200 bg-gray-50 sm:col-span-4" />
      </section>
    </main>
  );
}
