export default function ClientsLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Clients
          </h1>
          <p className="text-sm text-gray-600">Loading your clients…</p>
        </div>
      </header>
      <ul className="flex flex-col gap-3" aria-busy="true">
        {[0, 1, 2].map((placeholder) => (
          <li
            key={placeholder}
            className="h-16 animate-pulse rounded-md border border-gray-200 bg-gray-50"
          />
        ))}
      </ul>
    </main>
  );
}
