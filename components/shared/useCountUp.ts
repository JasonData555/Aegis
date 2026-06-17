'use client';

import { useEffect, useRef, useState } from 'react';

// Animates a numeric value from its previous value to a new target over
// durationMs whenever the target changes, using requestAnimationFrame and an
// ease-out curve. Returns the current in-flight value. The first render snaps
// to the initial target (no count-up on mount).

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const mountedRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Snap on first render — only animate subsequent changes
    if (!mountedRef.current) {
      mountedRef.current = true;
      fromRef.current = target;
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const current = from + (to - from) * easeOut(progress);
      setValue(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setValue(to);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
