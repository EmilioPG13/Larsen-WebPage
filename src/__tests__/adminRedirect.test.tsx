import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { LanguageProvider } from '../i18n/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';

// The redirect is what is under test, not the panel behind it.
vi.mock('../admin/services/adminApi', () => ({
  adminApi: { getMe: vi.fn(), getStats: vi.fn().mockResolvedValue({}), logout: vi.fn() },
}));

const renderAt = (path: string) => {
  window.history.pushState({}, '', path);
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>,
  );
};

describe('bare /admin route', () => {
  beforeEach(() => localStorage.clear());

  it('sends a visitor without a session to the login instead of showing a 404', async () => {
    renderAt('/admin');

    expect(await screen.findByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
  });

  it('still shows the 404 for a path that really does not exist', async () => {
    renderAt('/admin/no-existe');

    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument();
  });
});
