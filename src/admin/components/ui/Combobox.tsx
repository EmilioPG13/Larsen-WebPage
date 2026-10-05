import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronIcon } from './icons';
import { popoverClass, useClickOutside, usePanelPosition, usePresence } from './popover';

interface ComboboxProps {
  id?: string;
  value: string;
  /** Suggestions; the field still accepts any text. */
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const Combobox: React.FC<ComboboxProps> = ({ id, value, options, onChange, required, placeholder, className = '' }) => {
  const generatedId = useId();
  const inputId = id ?? `combobox-${generatedId}`;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Show every suggestion when the text already is one; otherwise narrow them down while typing.
  const typed = value.trim().toLowerCase();
  const exact = options.some((option) => option.toLowerCase() === typed);
  const visibleOptions = typed && !exact ? options.filter((option) => option.toLowerCase().includes(typed)) : options;

  const showList = open && visibleOptions.length > 0;
  const { mounted, visible } = usePresence(showList);
  const { side, style } = usePanelPosition(rootRef, showList, 280);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, listRef, open, close);

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const choose = (option: string) => {
    onChange(option);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      const last = visibleOptions.length - 1;
      setActive((index) => (event.key === 'ArrowDown' ? Math.min(index + 1, last) : Math.max(index - 1, 0)));
    } else if (event.key === 'Enter' && showList && active >= 0) {
      // Pick the highlighted suggestion instead of submitting the surrounding form.
      event.preventDefault();
      choose(visibleOptions[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="adm-input pr-9"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Mostrar opciones"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setOpen((current) => !current);
          setActive(-1);
          document.getElementById(inputId)?.focus();
        }}
        className="absolute inset-y-0 right-0 flex items-center border-0 bg-transparent px-3"
      >
        <ChevronIcon open={showList} />
      </button>

      {mounted &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            data-state={visible ? 'open' : 'closed'}
            data-side={side}
            style={style}
            className={`${popoverClass} max-h-60 overflow-y-auto`}
          >
            {visibleOptions.map((option, index) => (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option === value}
                style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
                data-active={index === active}
                data-selected={option === value}
                className="adm-opt adm-option"
              >
                {option}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
};

export default Combobox;
