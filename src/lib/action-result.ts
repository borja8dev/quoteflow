/**
 * Shared result type for Server Actions (ARCH-04). Server Actions must never
 * leak raw database or Supabase errors to the client: they return either
 * `{ ok: true, data }` on success or `{ ok: false, error }` with a user-safe
 * message on failure.
 */
export type ActionResult<TData = undefined, TFieldErrors = never> =
  | { ok: true; data: TData }
  | { ok: false; error: string; fieldErrors?: TFieldErrors };
