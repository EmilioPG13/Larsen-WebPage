/** Message sent by the API in `{ error }`, or the fallback when there is none. */
export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { error?: string } } } | null)?.response?.data?.error || fallback;
