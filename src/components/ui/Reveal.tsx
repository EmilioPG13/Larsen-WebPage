import type { CSSProperties, ElementType, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Use the on-mount rise animation instead of the scroll-driven reveal. */
  rise?: boolean;
  /** Animation delay in seconds (applied as animation-delay). */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Wraps content with the design's scroll-reveal (`data-reveal`) or on-mount
 * rise (`data-rise`) animation. Both are CSS-driven (see index.css) and are
 * disabled automatically under prefers-reduced-motion.
 */
export default function Reveal({
  children,
  rise = false,
  delay,
  as: Tag = 'div',
  className,
  style,
}: RevealProps) {
  const animationStyle: CSSProperties =
    delay !== undefined ? { ...style, animationDelay: `${delay}s` } : style ?? {};

  const attr = rise ? { 'data-rise': '' } : { 'data-reveal': '' };

  return (
    <Tag {...attr} className={className} style={animationStyle}>
      {children}
    </Tag>
  );
}
