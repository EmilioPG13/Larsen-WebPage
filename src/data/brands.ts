import type { Lang } from '../i18n/dictionary';

export interface BrandEntry {
  name: string;
  origin: { es: string; en: string };
  image: string;
  blurb: { es: string; en: string };
  /** Optional multiplier (0-1) to visually balance logos whose artwork reads larger than others at the same box height. */
  logoScale?: number;
}

// Ported from the Claude Design source (BRANDS[]). Order leads with Steiger —
// the Aries/Vesta line is the core of the refurbished catalogue.
export const brands: BrandEntry[] = [
  {
    name: 'Steiger',
    origin: { es: 'Suiza', en: 'Switzerland' },
    image: '/images/brands/Steiger ZAMARK.png',
    blurb: {
      es: 'Rectilíneas Aries y Vesta. La base de nuestra línea reacondicionada.',
      en: 'Aries and Vesta flat-knitting. The core of our refurbished line.',
    },
  },
  {
    name: 'Shima Seiki',
    origin: { es: 'Japón', en: 'Japan' },
    image: '/images/brands/SHIMA SEIKI.png',
    blurb: {
      es: 'Referente mundial en whole garment y programación de punto.',
      en: 'The world reference in whole garment and knit programming.',
    },
  },
  {
    name: 'Protti',
    origin: { es: 'Italia', en: 'Italy' },
    image: '/images/brands/PROTTI.png',
    blurb: {
      es: 'Rectilíneas italianas robustas y fáciles de mantener.',
      en: 'Robust Italian flat-knitting, straightforward to maintain.',
    },
    logoScale: 0.62,
  },
  {
    name: 'Scheller',
    origin: { es: 'Alemania', en: 'Germany' },
    image: '/images/brands/Scheller.png',
    blurb: {
      es: 'Equipo auxiliar y de acabado para el taller de punto.',
      en: 'Auxiliary and finishing equipment for the knitting floor.',
    },
  },
];

export const localized = <T,>(value: { es: T; en: T }, lang: Lang): T => value[lang];
