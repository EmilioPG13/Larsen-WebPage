import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es } from '../../i18n/dictionary';

const renderPage = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('NotFoundPage', () => {
  beforeEach(() => localStorage.clear());

  it('shows the 404 marker and the error copy', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(es.notFound.tag)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: es.notFound.t })).toBeInTheDocument();
  });

  it('offers a way back home and to the machines list', () => {
    renderPage();
    expect(screen.getByRole('link', { name: es.notFound.home })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: es.notFound.machines })).toHaveAttribute('href', '/maquinas');
  });
});
