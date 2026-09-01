import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AboutPage from '../AboutPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es } from '../../i18n/dictionary';

const renderPage = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/nosotros']}>
          <Routes>
            <Route path="/nosotros" element={<AboutPage />} />
            <Route path="/cotizacion" element={<div>quote-page</div>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('AboutPage', () => {
  beforeEach(() => localStorage.clear());

  it('renders the story, timeline and process sections', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: es.apage.t })).toBeInTheDocument();
    expect(screen.getByText(es.timeline[0].title)).toBeInTheDocument();
    expect(screen.getByText(es.process[0].title)).toBeInTheDocument();
  });

  it('lists the contact channels', () => {
    renderPage();
    expect(screen.getByRole('link', { name: '+52 775 365 0376' })).toHaveAttribute(
      'href',
      'tel:+527753650376',
    );
    expect(
      screen.getByRole('link', { name: 'admin@larsenitaliana.com' }),
    ).toHaveAttribute('href', 'mailto:admin@larsenitaliana.com');
  });

  it('routes to the quote page from the closing CTA', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: es.cend.b }));
    expect(screen.getByText('quote-page')).toBeInTheDocument();
  });
});
