import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

/** Versión canónica del sitio, sin www. Debe coincidir con sitemap.xml y robots.txt. */
const CANONICAL_ORIGIN = 'https://larsenitaliana.com';

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets the document <title>, meta description and canonical URL for the current
 * route, re-applying whenever the language changes.
 */
export function useDocumentMeta(title: string, description?: string) {
  const { lang } = useLanguage();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    if (description) setMetaTag('description', description);
  }, [title, description, lang]);

  useEffect(() => {
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    setCanonical(`${CANONICAL_ORIGIN}${path}`);
  }, [pathname]);
}
