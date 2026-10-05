import { describe, expect, it } from 'vitest';
import { loginErrorMessage } from '../services/apiError';

const failure = (status: number, data: Record<string, unknown>) => ({ response: { status, data } });

describe('loginErrorMessage', () => {
  it('explains a lockout with the wait rounded up to whole minutes', () => {
    expect(loginErrorMessage(failure(429, { retryAfterSeconds: 61 }), 'x')).toBe(
      'Demasiados intentos fallidos. Espera 2 min e inténtalo de nuevo.'
    );
    expect(loginErrorMessage(failure(429, { retryAfterSeconds: 1 }), 'x')).toContain('Espera 1 min');
  });

  it('still explains a lockout when the wait is missing', () => {
    expect(loginErrorMessage(failure(429, {}), 'x')).toContain('Espera unos minutos');
  });

  it('keeps the server message for other failures', () => {
    expect(loginErrorMessage(failure(401, { error: 'Invalid email or password' }), 'x')).toBe(
      'Invalid email or password'
    );
  });

  it('falls back when there is no response', () => {
    expect(loginErrorMessage(new Error('Network Error'), 'Error al iniciar sesión')).toBe(
      'Error al iniciar sesión'
    );
  });
});
