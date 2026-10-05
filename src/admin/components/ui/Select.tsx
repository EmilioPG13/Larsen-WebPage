import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronIcon } from './icons';
import { popoverClass, triggerClass, useClickOutside, usePanelPosition, usePresence } from './popover';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name when there is no `<label htmlFor>` pointing at the trigger. */
  ariaLabel?: string;
  className?: string;
  /** Tighter trigger for use inside table rows. */
  compact?: boolean;
}

const Select: React.FC<SelectProps> = ({
  id,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  disabled,
  ariaLabel,
  className = '',
  compact,
}) => {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const listId = `${triggerId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { mounted, visible } = usePresence(open);
  const { side, style } = usePanelPosition(rootRef, open, 280);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, listRef, open, close);

  const openList = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active, mounted]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(active);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`${triggerClass} ${compact ? 'px-2! py-1!' : ''}`}
      >
        <span className={`truncate ${selected ? 'text-a-ink' : 'text-a-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {mounted &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-state={visible ? 'open' : 'closed'}
            data-side={side}
            style={style}
            className={`${popoverClass} max-h-60 overflow-y-auto`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  data-active={index === active}
                  data-selected={isSelected}
                  className="adm-opt adm-option"
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckIcon />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
};

export default Select;
