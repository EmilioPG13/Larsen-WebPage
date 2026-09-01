import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrandsPage from '../BrandsPage';
import { LanguageProvider, useLanguage } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { brands } from '../../data/brands';

const ToEnglish = () => {
  const { setLang } = useLanguage();
  return <button onClick={() => setLang('en')}>to-en</button>;
};

const renderPage = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>
          <ToEnglish />
          <BrandsPage />
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('BrandsPage', () => {
  beforeEach(() => localStorage.clear());

  it('renders one card per brand, each deep-linking to its machine filter', () => {
    renderPage();
    for (const b of brands) {
      const link = screen.getByRole('link', { name: new RegExp(b.name, 'i') });
      expect(link).toHaveAttribute(
        'href',
        `/maquinas?brand=${encodeURIComponent(b.name)}`,
      );
    }
  });

  it('shows the localized blurb and swaps it when the language changes', () => {
    renderPage();
    expect(screen.getByText(brands[0].blurb.es)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'to-en' }));

    expect(screen.getByText(brands[0].blurb.en)).toBeInTheDocument();
    expect(screen.queryByText(brands[0].blurb.es)).not.toBeInTheDocument();
  });
});
