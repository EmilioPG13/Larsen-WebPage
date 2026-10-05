import React from 'react';

const base = {
  'aria-hidden': true,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'butt' as const,
  strokeLinejoin: 'miter' as const,
};

export const ChevronIcon: React.FC<{ open?: boolean }> = ({ open }) => (
  <svg
    {...base}
    strokeWidth="2"
    className={`h-4 w-4 shrink-0 text-a-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
  >
    <path d="m5 7.5 5 5 5-5" />
  </svg>
);

export const CheckIcon: React.FC = () => (
  <svg {...base} strokeWidth="2.2" className="h-4 w-4 shrink-0">
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
);

export const CalendarIcon: React.FC = () => (
  <svg {...base} strokeWidth="1.7" className="h-4 w-4 shrink-0 text-a-muted">
    <rect x="3" y="4.5" width="14" height="12.5" rx="0" />
    <path d="M3 8.5h14M7 2.75v3M13 2.75v3" />
  </svg>
);

export const ArrowIcon: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => (
  <svg {...base} strokeWidth="2" className="h-4 w-4">
    <path d={direction === 'left' ? 'm12 5-5 5 5 5' : 'm8 5 5 5-5 5'} />
  </svg>
);
