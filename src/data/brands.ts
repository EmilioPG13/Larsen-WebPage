import type { Lang } from '../i18n/dictionary';

export interface BrandEntry {
  name: string;
  origin: { es: string; en: string };
  image: string;
  blurb: { es: string; en: string };
}

// Ported from the Claude Design source (rawBrands()).
export const brands: BrandEntry[] = [
  {
    name: 'Shima Seiki',
    origin: { es: 'Japón', en: 'Japan' },
    image: '/images/brands/SHIMA SEIKI.png',
    blurb: {
      es: 'Pionero japonés del tejido rectilíneo computarizado y la tecnología WHOLEGARMENT.',
      en: 'Japanese pioneer of computerised flat knitting and WHOLEGARMENT technology.',
    },
  },
  {
    name: 'Stoll',
    origin: { es: 'Alemania', en: 'Germany' },
    image: '/images/brands/STOLL.png',
    blurb: {
      es: 'Referente alemán en máquinas de tejido rectilíneo electrónico de altas prestaciones.',
      en: 'German benchmark in high-performance electronic flat-knitting machines.',
    },
  },
  {
    name: 'Steiger',
    origin: { es: 'Suiza', en: 'Switzerland' },
    image: '/images/brands/Steiger ZAMARK.png',
    blurb: {
      es: 'Fabricante suizo de máquinas rectilíneas electrónicas precisas y versátiles.',
      en: 'Swiss maker of precise, versatile electronic flat-knitting machines.',
    },
  },
  {
    name: 'Protti',
    origin: { es: 'Italia', en: 'Italy' },
    image: '/images/brands/PROTTI.png',
    blurb: {
      es: 'Histórica marca italiana de máquinas de tejido rectilíneo.',
      en: 'Historic Italian flat-knitting machine brand.',
    },
  },
  {
    name: 'Scheller',
    origin: { es: 'Europa', en: 'Europe' },
    image: '/images/brands/Scheller.png',
    blurb: {
      es: 'Maquinaria textil europea para tejido de punto y confección.',
      en: 'European textile machinery for knitting and garment-making.',
    },
  },
];

export const localized = <T,>(value: { es: T; en: T }, lang: Lang): T => value[lang];
