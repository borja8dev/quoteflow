/**
 * Tiny className joiner for Tailwind utility strings. Filters out falsy values
 * so component classes and caller overrides compose cleanly without adding a
 * runtime dependency (clsx / classnames).
 */
export function cn(
  ...values: ReadonlyArray<string | false | null | undefined>
): string {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}
