import { dictionaries, type Dictionary } from './dictionary';
import { useLanguage } from './LanguageContext';

/**
 * Returns the active language's translation tree, matching the design's
 * `t.section.key` access pattern (e.g. t.hero.tag, t.qpage.submit).
 */
export function useT(): Dictionary {
  const { lang } = useLanguage();
  return dictionaries[lang];
}
