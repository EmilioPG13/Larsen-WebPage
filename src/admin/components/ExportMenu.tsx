import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronIcon } from './ui/icons';
import { popoverClass, useClickOutside, usePanelPosition, usePresence } from './ui/popover';

export type ExportFormat = 'xlsx' | 'pdf';

interface ExportMenuProps {
  /** True while a file is being generated. */
  busy: boolean;
  disabled: boolean;
  onExport: (format: ExportFormat) => void;
}

const PANEL_WIDTH = 248;

const options: { format: ExportFormat; title: string; detail: string; badge: string; badgeClass: string }[] = [
  {
    format: 'xlsx',
    title: 'Excel (.xlsx)',
    detail: 'Hoja de cálculo con resumen',
    badge: 'XLS',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    format: 'pdf',
    title: 'PDF',
    detail: 'Para imprimir o compartir',
    badge: 'PDF',
    badgeClass: 'bg-red-100 text-red-700',
  },
];

/**
 * Split button: a click on the main part exports Excel, which is what the company works with; the arrow
 * opens the other formats.
 */
const ExportMenu: React.FC<ExportMenuProps> = ({ busy, disabled, onExport }) => {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { mounted, visible } = usePresence(open);
  const { side, style } = usePanelPosition(rootRef, open, 160, PANEL_WIDTH, 'end');

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, panelRef, open, close);

  useEffect(() => {
    if (open && mounted) panelRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [open, mounted]);

  const choose = (format: ExportFormat) => {
    setOpen(false);
    onExport(format);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      toggleRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const base =
    'bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red';

  return (
    <div ref={rootRef} className="inline-flex">
      <button
        type="button"
        onClick={() => onExport('xlsx')}
        disabled={disabled || busy}
        className={`${base} rounded-l-lg px-4 py-2`}
      >
        {busy ? 'Exportando...' : 'Exportar Excel'}
      </button>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Más formatos de exportación"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled || busy}
        onClick={() => setOpen((current) => !current)}
        className={`${base} flex items-center rounded-r-lg border-l border-gray-300 px-2.5`}
      >
        <ChevronIcon open={open} />
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label="Formato de exportación"
            data-state={visible ? 'open' : 'closed'}
            data-side={side}
            style={style}
            onKeyDown={handleMenuKeyDown}
            className={popoverClass}
          >
            {options.map((option, index) => (
              <button
                key={option.format}
                type="button"
                role="menuitem"
                onClick={() => choose(option.format)}
                style={{ '--i': index } as React.CSSProperties}
                className="adm-opt flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide ${option.badgeClass}`}
                >
                  {option.badge}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                  <span className="block text-xs text-gray-500">{option.detail}</span>
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ExportMenu;
