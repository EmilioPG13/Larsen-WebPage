import { useEffect } from 'react';
import { useLanguage } from './LanguageContext';

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets the document <title> and meta description for the current route,
 * re-applying whenever the language changes.
 */
export function useDocumentMeta(title: string, description?: string) {
  const { lang } = useLanguage();
  useEffect(() => {
    document.title = title;
    if (description) setMetaTag('description', description);
  }, [title, description, lang]);
}
