import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MachineImage from '../ui/MachineImage';
import { resolveImage } from '../../utils/machineImage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { es } from '../../i18n/dictionary';

const renderImage = (props: Parameters<typeof MachineImage>[0]) =>
  render(
    <LanguageProvider>
      <MachineImage {...props} />
    </LanguageProvider>,
  );

describe('resolveImage', () => {
  it('restores the casing of a bundled file', () => {
    expect(resolveImage('/images/machines/aries3.PNG')).toBe('/images/machines/ARIES3.png');
    expect(resolveImage('images/brands/shima seiki.png')).toBe('/images/brands/SHIMA SEIKI.png');
  });

  it('keeps unknown paths, absolute URLs and data URIs as they are', () => {
    expect(resolveImage('/images/machines/new-model.png')).toBe('/images/machines/new-model.png');
    expect(resolveImage('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveImage('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('returns undefined when there is no image', () => {
    expect(resolveImage(null)).toBeUndefined();
    expect(resolveImage('')).toBeUndefined();
  });
});

describe('MachineImage', () => {
  beforeEach(() => localStorage.clear());

  it('renders the normalized image', () => {
    renderImage({ src: '/images/machines/aries3.png', alt: 'Steiger Aries.3' });
    expect(screen.getByRole('img', { name: 'Steiger Aries.3' })).toHaveAttribute(
      'src',
      '/images/machines/ARIES3.png',
    );
  });

  it('swaps a failed image for a labelled placeholder', () => {
    renderImage({ src: '/images/machines/missing.png', alt: 'Steiger Aries.3' });
    fireEvent.error(screen.getByRole('img', { name: 'Steiger Aries.3' }));
    expect(screen.getByText(es.mpage.noImage)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Steiger Aries.3' }).tagName).toBe('DIV');
  });

  it('shows the placeholder straight away when there is no source', () => {
    renderImage({ src: null, alt: 'Shima Seiki SES 122S' });
    expect(screen.getByText(es.mpage.noImage)).toBeInTheDocument();
  });
});
