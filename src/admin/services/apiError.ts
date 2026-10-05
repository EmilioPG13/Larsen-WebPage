/** Message sent by the API in `{ error }`, or the fallback when there is none. */
export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { error?: string } } } | null)?.response?.data?.error || fallback;

/** Login failure text: a blocked IP (429) gets a Spanish message with the wait. */
export const loginErrorMessage = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { status?: number; data?: { retryAfterSeconds?: number } } } | null)
    ?.response;

  if (response?.status === 429) {
    const seconds = response.data?.retryAfterSeconds;
    const wait = seconds ? `${Math.max(1, Math.ceil(seconds / 60))} min` : 'unos minutos';
    return `Demasiados intentos fallidos. Espera ${wait} e inténtalo de nuevo.`;
  }

  return apiErrorMessage(err, fallback);
};
