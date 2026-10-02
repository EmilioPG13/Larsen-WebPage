import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Footer from '../Footer';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es, en } from '../../i18n/dictionary';

const renderFooter = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Footer />} />
            <Route path="/admin/login" element={<div>Pantalla de login</div>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('Footer team access link', () => {
  beforeEach(() => localStorage.clear());

  it('links to the admin login', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: es.foot.team })).toHaveAttribute('href', '/admin/login');
  });

  it('takes the team to the login when clicked', async () => {
    renderFooter();

    await userEvent.setup().click(screen.getByRole('link', { name: es.foot.team }));

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('has a text in both languages', () => {
    expect(es.foot.team).toBe('Acceso equipo');
    expect(en.foot.team).toBe('Team login');
  });
});
