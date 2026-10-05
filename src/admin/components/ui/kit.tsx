import React from 'react';

/* ------------------------------------------------------------
   Stitch marks: the state vocabulary of the panel. Shape alone
   carries the meaning, color is only reinforcement.
   ------------------------------------------------------------ */
export type MarkName =
  | 'ring'
  | 'slash'
  | 'dot'
  | 'cross'
  | 'sq'
  | 'sqslash'
  | 'sqcheck'
  | 'sqdash'
  | 'alert'
  | 'check';

const markPaths: Record<MarkName, React.ReactNode> = {
  ring: <circle cx="8" cy="8" r="4.5" />,
  slash: (
    <>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M3.5 12.5 12.5 3.5" />
    </>
  ),
  dot: <circle cx="8" cy="8" r="4.5" fill="currentColor" />,
  cross: <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />,
  sq: <rect x="3.5" y="3.5" width="9" height="9" fill="currentColor" />,
  sqslash: (
    <>
      <rect x="3.5" y="3.5" width="9" height="9" />
      <path d="M3.5 12.5 12.5 3.5" />
    </>
  ),
  sqcheck: (
    <>
      <rect x="3.5" y="3.5" width="9" height="9" />
      <path d="m5.6 8.2 1.7 1.7 3.2-3.8" />
    </>
  ),
  sqdash: (
    <>
      <rect x="3.5" y="3.5" width="9" height="9" />
      <path d="M5.6 8h4.8" />
    </>
  ),
  alert: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" />
      <path d="M8 5.2v3.6" />
      <path d="M8 10.6v.9" />
    </>
  ),
  check: <path d="m3.5 8.6 3 3 6-7" />,
};

export const Mark: React.FC<{ name: MarkName; size?: number; className?: string }> = ({
  name,
  size = 16,
  className,
}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 16 16"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="butt"
    strokeLinejoin="miter"
    data-mark={name}
    className={`shrink-0 ${className ?? ''}`}
  >
    {markPaths[name]}
  </svg>
);

/* ------------------------------------------------------------
   Navigation and utility icons (20px grid, same 1.5 stroke)
   ------------------------------------------------------------ */
export type IconName =
  | 'dashboard'
  | 'inventory'
  | 'reports'
  | 'products'
  | 'machines'
  | 'brands'
  | 'leads'
  | 'users'
  | 'key'
  | 'exit'
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'
  | 'chevron'
  | 'arrow'
  | 'plus'
  | 'download';

const iconPaths: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="6" height="6" />
      <rect x="11" y="3" width="6" height="6" fill="currentColor" />
      <rect x="3" y="11" width="6" height="6" />
      <rect x="11" y="11" width="6" height="6" />
    </>
  ),
  inventory: (
    <>
      <rect x="3" y="3" width="14" height="14" />
      <path d="M3 7.7h14M3 12.3h14" />
      <path d="M6.5 5.35h1.5" />
    </>
  ),
  reports: (
    <>
      <path d="M3 17h14" />
      <rect x="4.5" y="10" width="2.5" height="7" />
      <rect x="8.75" y="5" width="2.5" height="12" fill="currentColor" />
      <rect x="13" y="8" width="2.5" height="9" />
    </>
  ),
  products: (
    <>
      <path d="M10 2.5 16.5 6v8L10 17.5 3.5 14V6L10 2.5Z" />
      <path d="M3.5 6 10 9.5 16.5 6M10 9.5v8" />
    </>
  ),
  machines: (
    <>
      <path d="M2.5 14h15v3h-15z" />
      <path d="M5 14V4M8.5 14V6M12 14V4M15.5 14V6" />
    </>
  ),
  brands: (
    <>
      <path d="M3 3h7.5l6.5 6.5-7.5 7.5L3 10.5V3Z" />
      <circle cx="7" cy="7" r="1.3" />
    </>
  ),
  leads: (
    <>
      <path d="M3 11.5 5.5 4h9L17 11.5V16H3v-4.5Z" />
      <path d="M3 11.5h4.2l.8 2h4l.8-2H17" />
    </>
  ),
  users: (
    <>
      <circle cx="7.5" cy="6.5" r="2.8" />
      <path d="M2.5 16.5c0-3 2.2-4.8 5-4.8s5 1.8 5 4.8" />
      <path d="M13 4.2a2.8 2.8 0 0 1 0 5.4M14.2 12c1.9.5 3.3 2 3.3 4.5" />
    </>
  ),
  key: (
    <>
      <circle cx="6.5" cy="13.5" r="3" />
      <path d="m8.8 11.2 7.2-7.2M13.5 6.5l2 2M11.5 8.5l1.5 1.5" />
    </>
  ),
  exit: (
    <>
      <path d="M8 3.5H4v13h4" />
      <path d="M8 10h9M13.5 6.5 17 10l-3.5 3.5" />
    </>
  ),
  menu: <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />,
  close: <path d="m5 5 10 10M15 5 5 15" />,
  sun: (
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
    </>
  ),
  moon: <path d="M16.5 11.8A6.8 6.8 0 0 1 8.2 3.5a6.8 6.8 0 1 0 8.3 8.3Z" />,
  chevron: <path d="m5 7.5 5 5 5-5" />,
  arrow: <path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5" />,
  plus: <path d="M10 4v12M4 10h12" />,
  download: <path d="M10 3v10M5.5 9 10 13.5 14.5 9M3.5 16.5h13" />,
};

export const Icon: React.FC<{ name: IconName; size?: number; className?: string }> = ({
  name,
  size = 20,
  className,
}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="butt"
    strokeLinejoin="miter"
    className={`shrink-0 ${className ?? ''}`}
  >
    {iconPaths[name]}
  </svg>
);

/** Wordmark cell: a 3x3 chart whose filled cells draw an L. */
export const CellMark: React.FC<{ size?: number }> = ({ size = 28 }) => {
  const filled = new Set(['0-0', '0-1', '0-2', '1-2', '2-2']);
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const on = filled.has(`${col}-${row}`);
      cells.push(
        <rect
          key={`${col}-${row}`}
          x={1 + col * 8}
          y={1 + row * 8}
          width="6.5"
          height="6.5"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1"
        />,
      );
    }
  }
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 26 26" width={size} height={size}>
      {cells}
    </svg>
  );
};

/* ------------------------------------------------------------
   Page building blocks
   ------------------------------------------------------------ */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <header className="adm-head">
    <div className="min-w-0">
      <h1 className="adm-title">{title}</h1>
      {subtitle && <p className="adm-sub">{subtitle}</p>}
    </div>
    {actions && <div className="adm-actions">{actions}</div>}
  </header>
);

export const Panel: React.FC<{
  title?: string;
  note?: string;
  aside?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, note, aside, className = '', bodyClassName = 'adm-panel-body', children }) => (
  <section className={`adm-panel ${className}`}>
    {title && (
      <div className="adm-panel-head">
        <div className="min-w-0">
          <h2 className="adm-panel-title">{title}</h2>
          {note && <p className="adm-note">{note}</p>}
        </div>
        {aside}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const Alert: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`adm-alert ${className}`} role="alert">
    <Mark name="alert" className="mt-0.5" />
    <div className="min-w-0">{children}</div>
  </div>
);

export const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="adm-notice" role="status">
    <Mark name="check" className="mt-0.5" />
    <div className="min-w-0">{children}</div>
  </div>
);

export const Tag: React.FC<{
  mark?: MarkName;
  tone?: 'plain' | 'navy' | 'red' | 'solid';
  children: React.ReactNode;
}> = ({ mark, tone = 'plain', children }) => (
  <span className={`adm-tag ${tone === 'plain' ? '' : `adm-tag-${tone}`}`}>
    {mark && <Mark name={mark} size={14} />}
    {children}
  </span>
);

/** Loading state: the text stays for assistive tech and tests; bars hint at the layout. */
export const PageLoading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="adm-page">
    <div className="adm-panel">
      <div className="adm-panel-body" role="status">
        <div className="adm-label-sm mb-4">{children}</div>
        <div aria-hidden="true" className="space-y-3">
          <div className="adm-skel" style={{ width: '60%' }} />
          <div className="adm-skel" style={{ width: '88%' }} />
          <div className="adm-skel" style={{ width: '74%' }} />
        </div>
      </div>
    </div>
  </div>
);

export const PageError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="adm-page">
    <div className="adm-alert" role="alert" style={{ marginBottom: 0 }}>
      <Mark name="alert" className="mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  </div>
);

/** Empty state that says what to do next, not just "nothing here". */
export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="m-0 py-6 text-center text-a-muted">{children}</p>
);

/**
 * The company wordmark in its official colors. On a dark surface (`onDark`) it sits
 * on a white plate, the same treatment the public header uses, so the blue half of
 * the logo never disappears into the navy rail and the colors are never altered.
 */
export const AdminLogo: React.FC<{ height?: number; onDark?: boolean }> = ({ height = 28, onDark = false }) => {
  const logo = (
    <img
      src="/images/logo/larsen-logo-1.png"
      alt="Larsen Italiana"
      height={height}
      style={{ height, width: 'auto', alignSelf: 'flex-start' }}
      className="block shrink-0 object-contain"
    />
  );
  if (!onDark) return logo;
  return (
    <span
      className="inline-flex shrink-0 self-start bg-white"
      style={{ padding: `${Math.round(height * 0.28)}px ${Math.round(height * 0.4)}px` }}
    >
      {logo}
    </span>
  );
};
