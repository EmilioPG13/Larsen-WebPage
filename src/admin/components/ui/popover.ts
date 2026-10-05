import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Keeps a popover mounted while its exit transition plays.
 * `mounted` says whether to render it; `visible` drives the `data-state` the CSS transitions on.
 */
export function usePresence(open: boolean, exitMs = 160) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two frames so the closed styles are painted once before switching to the open ones.
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, visible };
}

/** Calls `onOutside` for a mouse or touch press outside both the trigger area and the floating panel. */
export function useClickOutside(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      onOutside();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [anchorRef, panelRef, active, onOutside]);
}

const GAP = 8;
const MARGIN = 8;

/**
 * Places a portaled panel next to its anchor with fixed positioning, so no scrolling or clipping
 * ancestor (a table wrapper, a modal) can cut it off. Opens upwards when there is no room below.
 * `width` is the panel's own width; without it the panel is at least as wide as the anchor.
 * `align: 'end'` lines the panel's right edge up with the anchor's, for triggers at the right of the page.
 */
export function usePanelPosition(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
  needed: number,
  width?: number,
  align: 'start' | 'end' = 'start',
) {
  const [position, setPosition] = useState<{
    side: 'bottom' | 'top';
    style: CSSProperties;
  }>({
    side: 'bottom',
    style: {},
  });

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      const side = below < needed && rect.top > below ? 'top' : 'bottom';
      const panelWidth = width ?? rect.width;
      const preferred = align === 'end' ? rect.right - panelWidth : rect.left;
      const left = Math.max(MARGIN, Math.min(preferred, window.innerWidth - panelWidth - MARGIN));
      setPosition({
        side,
        style: {
          position: 'fixed',
          left,
          minWidth: rect.width,
          ...(width ? { width } : {}),
          ...(side === 'bottom' ? { top: rect.bottom + GAP } : { bottom: window.innerHeight - rect.top + GAP }),
        },
      });
    };
    update();
    // Capture so scrolling inside a modal or table wrapper also repositions the panel.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, open, needed, width, align]);

  return position;
}

/** Shared classes for the floating panel of every popover. Sits above the admin modals (z-50). */
export const popoverClass = 'adm-pop z-[70] rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5';

export const triggerClass =
  'flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-larsen-red disabled:cursor-not-allowed disabled:opacity-60';
