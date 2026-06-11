'use client';

import { useEffect, useRef, useState } from 'react';

// Dollar stat that counts up from zero when scrolled into view.

export default function CountUpStat({
  value,
  durationMs = 800,
  className = '',
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (started.current || !entries.some(e => e.isIntersecting)) return;
        started.current = true;
        observer.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - t0) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <div ref={ref} className={className}>
      ${display.toLocaleString('en-US')}
    </div>
  );
}
