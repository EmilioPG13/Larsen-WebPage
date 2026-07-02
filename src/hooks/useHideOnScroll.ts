import { useEffect, useRef, useState } from 'react';

interface UseHideOnScrollOptions {
  /** Always visible until the user scrolls past this many pixels. */
  topOffset?: number;
  /** Minimum scroll delta (px) before a direction change registers, to avoid jitter. */
  buffer?: number;
  /** When true, forces the visible state and ignores scroll (e.g. mobile menu open). */
  disabled?: boolean;
  /** Changing this value forces the visible state, e.g. on route change. */
  resetKey?: unknown;
}

/** Tracks scroll direction to drive a "hide on scroll down, reveal on scroll up" nav. */
export function useHideOnScroll(options: UseHideOnScrollOptions = {}): boolean {
  const { topOffset = 96, buffer = 8, disabled = false, resetKey } = options;

  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
    if (disabled) setHidden(false);
  }, [disabled]);

  useEffect(() => {
    setHidden(false);
    lastYRef.current = window.scrollY;
  }, [resetKey]);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const currentY = Math.max(window.scrollY, 0);

        if (disabledRef.current) {
          lastYRef.current = currentY;
          return;
        }

        if (currentY <= topOffset) {
          setHidden(false);
        } else {
          const delta = currentY - lastYRef.current;
          if (delta >= buffer) setHidden(true);
          else if (delta <= -buffer) setHidden(false);
        }
        lastYRef.current = currentY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [topOffset, buffer]);

  return hidden;
}
