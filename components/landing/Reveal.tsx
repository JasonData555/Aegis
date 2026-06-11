'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Landing-page entrance wrapper: fade in while rising `dy` px. `immediate`
// plays on mount; otherwise plays once when the element scrolls into view.

export default function Reveal({
  children,
  dy = 12,
  delay = 0,
  duration = 600,
  immediate = false,
  className,
}: {
  children: ReactNode;
  dy?: number;
  delay?: number;
  duration?: number;
  immediate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  const style: CSSProperties = visible
    ? {
        animation: `aegis-fade-up ${duration}ms ease-out ${delay}ms both`,
        ['--aegis-fade-dy' as string]: `${dy}px`,
      }
    : { opacity: 0, transform: `translateY(${dy}px)` };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
