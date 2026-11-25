"use client";

type QuotesErrorProps = {
  reset: () => void;
};

export default function QuotesError({ reset }: QuotesErrorProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Quotes
        </h1>
      </header>
      <section
        role="alert"
        className="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <p>We could not load your quotes.</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
