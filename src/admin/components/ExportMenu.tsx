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
    badgeClass: 'border-a-navy text-a-navy',
  },
  {
    format: 'pdf',
    title: 'PDF',
    detail: 'Para imprimir o compartir',
    badge: 'PDF',
    badgeClass: 'border-a-line-strong text-a-text2',
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


  return (
    <div ref={rootRef} className="inline-flex">
      <button
        type="button"
        onClick={() => onExport('xlsx')}
        disabled={disabled || busy}
        className="adm-btn"
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
        className="adm-btn -ml-px px-2.5"
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
                className="adm-opt flex w-full items-center gap-3 border-0 bg-transparent px-3 py-2.5 text-left transition-colors relative adm-brackets-in hover:bg-a-navy-soft focus:bg-a-navy-soft"
              >
                <span
                  aria-hidden="true"
                  className={`adm-num flex h-9 w-9 shrink-0 items-center justify-center border text-[11px] font-semibold tracking-wide ${option.badgeClass}`}
                >
                  {option.badge}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-a-ink">{option.title}</span>
                  <span className="block text-[13px] text-a-muted">{option.detail}</span>
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
