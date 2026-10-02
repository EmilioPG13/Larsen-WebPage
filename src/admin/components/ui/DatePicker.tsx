import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowIcon, CalendarIcon } from './icons';
import { popoverClass, triggerClass, useClickOutside, usePanelPosition, usePresence } from './popover';

interface DatePickerProps {
  id?: string;
  /** `YYYY-MM-DD`, or an empty string when there is no date. */
  value: string;
  onChange: (value: string) => void;
  /** Adds a "Borrar" action, for optional dates. */
  allowClear?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface MonthView {
  year: number;
  month: number; // 0-based
}

const PANEL_WIDTH = 288;
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

const parseIso = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match
    ? {
        year: Number(match[1]),
        month: Number(match[2]) - 1,
        day: Number(match[3]),
      }
    : null;
};

/** Calendar arithmetic in UTC so daylight saving never shifts a day. */
const utcDate = (iso: string) => {
  const parsed = parseIso(iso)!;
  return new Date(Date.UTC(parsed.year, parsed.month, parsed.day));
};
const fromUtc = (date: Date) => toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const addDays = (iso: string, days: number) => {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
};
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const todayIso = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

const shortFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const longFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthFormat = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  timeZone: 'UTC',
});

const monthLabel = ({ year, month }: MonthView) => {
  const name = monthFormat.format(new Date(Date.UTC(year, month, 1)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

const viewOf = (iso: string): MonthView => {
  const parsed = parseIso(iso)!;
  return { year: parsed.year, month: parsed.month };
};

const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  allowClear,
  placeholder = 'Seleccionar fecha',
  disabled,
  className = '',
}) => {
  const generatedId = useId();
  const triggerId = id ?? `date-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldFocusDay = useRef(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MonthView>(() => viewOf(value || todayIso()));
  const [focusIso, setFocusIso] = useState(value || todayIso());
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const { mounted, visible } = usePresence(open, 180);
  const { side, style } = usePanelPosition(rootRef, open, 380, PANEL_WIDTH);

  const today = todayIso();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, panelRef, open, close);

  const openPanel = () => {
    const start = value || todayIso();
    setView(viewOf(start));
    setFocusIso(start);
    setDirection(null);
    shouldFocusDay.current = true;
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !mounted || !shouldFocusDay.current) return;
    const button = panelRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusIso}"]`);
    if (button) {
      button.focus({ preventScroll: true });
      shouldFocusDay.current = false;
    }
  }, [open, mounted, focusIso, view]);

  const shiftMonth = (delta: number) => {
    const target = new Date(Date.UTC(view.year, view.month + delta, 1));
    const next = { year: target.getUTCFullYear(), month: target.getUTCMonth() };
    const day = Math.min(parseIso(focusIso)!.day, daysInMonth(next.year, next.month));
    setDirection(delta > 0 ? 'next' : 'prev');
    setView(next);
    setFocusIso(toIso(next.year, next.month, day));
  };

  const moveFocus = (iso: string) => {
    const target = viewOf(iso);
    if (target.year !== view.year || target.month !== view.month) {
      setDirection(iso > focusIso ? 'next' : 'prev');
      setView(target);
    }
    shouldFocusDay.current = true;
    setFocusIso(iso);
  };

  const choose = (iso: string) => {
    onChange(iso);
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  };

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in steps) {
      event.preventDefault();
      moveFocus(addDays(focusIso, steps[event.key]));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const delta = event.key === 'PageDown' ? 1 : -1;
      const target = new Date(Date.UTC(view.year, view.month + delta, 1));
      const day = Math.min(parseIso(focusIso)!.day, daysInMonth(target.getUTCFullYear(), target.getUTCMonth()));
      moveFocus(toIso(target.getUTCFullYear(), target.getUTCMonth(), day));
    }
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      document.getElementById(triggerId)?.focus();
    }
  };

  // Always six weeks so the panel keeps its height from month to month.
  const firstOfMonth = toIso(view.year, view.month, 1);
  const leading = (utcDate(firstOfMonth).getUTCDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -leading);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={triggerClass}
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? shortFormat.format(utcDate(value)) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Elegir fecha"
            data-state={visible ? 'open' : 'closed'}
            data-side={side}
            style={style}
            onKeyDown={handlePanelKeyDown}
            className={`${popoverClass} p-3`}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => shiftMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red"
              >
                <ArrowIcon direction="left" />
              </button>
              <span className="text-sm font-semibold text-gray-900" aria-live="polite">
                {monthLabel(view)}
              </span>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => shiftMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-400" aria-hidden="true">
              {WEEKDAYS.map((weekday, index) => (
                <span key={index} className="py-1">
                  {weekday}
                </span>
              ))}
            </div>

            <div
              key={`${view.year}-${view.month}`}
              className={`grid grid-cols-7 gap-y-0.5 ${
                direction === 'next' ? 'adm-cal-next' : direction === 'prev' ? 'adm-cal-prev' : ''
              }`}
            >
              {days.map((iso) => {
                const inMonth = parseIso(iso)!.month === view.month;
                const isSelected = iso === value;
                const isToday = iso === today;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-date={iso}
                    tabIndex={iso === focusIso ? 0 : -1}
                    aria-label={longFormat.format(utcDate(iso))}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => choose(iso)}
                    onKeyDown={handleDayKeyDown}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red ${
                      isSelected
                        ? 'bg-larsen-red font-semibold text-white shadow-sm'
                        : isToday
                          ? 'font-semibold text-larsen-red ring-1 ring-larsen-red/40 hover:bg-red-50'
                          : inMonth
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {parseIso(iso)!.day}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => choose(today)}
                className="rounded-full px-3 py-1 text-sm font-medium text-larsen-red transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red"
              >
                Hoy
              </button>
              {allowClear && value && (
                <button
                  type="button"
                  onClick={() => choose('')}
                  className="rounded-full px-3 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-larsen-red"
                >
                  Borrar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DatePicker;
