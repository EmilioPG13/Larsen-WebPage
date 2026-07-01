import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CountUpProps {
  to: number;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
  durationMs?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from 0 up to `to` once it scrolls into view, with locale-aware
 * formatting and an optional suffix. Ports the design's count() animation.
 */
export default function CountUp({ to, suffix = '', className, style, durationMs = 1500 }: CountUpProps) {
  const { lang } = useLanguage();
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const final = to.toLocaleString(locale) + suffix;

  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(() => (0).toLocaleString(locale) + suffix);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setDisplay(final);
      return;
    }

    let raf = 0;
    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / durationMs);
        const eased = 1 - Math.pow(1 - k, 3);
        setDisplay(Math.round(eased * to).toLocaleString(locale) + suffix);
        if (k < 1) raf = requestAnimationFrame(tick);
        else setDisplay(final);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    // re-run when language changes so the formatted final value updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, suffix, locale]);

  // keep the rendered value in sync if it finished before a language switch
  useEffect(() => {
    if (startedRef.current) setDisplay(final);
  }, [final]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}
