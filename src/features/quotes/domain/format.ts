/**
 * Display helpers for quote amounts.
 *
 * Pure module: no React, Supabase or Next.js imports. Keeps UI-05 (Spanish
 * euro formatting) in one place so both server-rendered pages and client
 * components agree on `1.234,56 €`.
 */

const EURO_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format an integer cent amount as a Spanish euro string, e.g. 123456 ->
 * "1.234,56 €". Non-finite inputs fall back to "—" so the UI never crashes
 * on bad data coming off the database.
 */
export function formatCentsAsEuros(cents: number): string {
  if (!Number.isFinite(cents)) {
    return "—";
  }
  return EURO_FORMATTER.format(cents / 100);
}
