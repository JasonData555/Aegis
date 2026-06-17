'use client';

import { useEffect, useRef, useState } from 'react';

// Renders text that crossfades when it changes: old fades out 150ms, new fades
// in 200ms. When the text is unchanged it does nothing. Used for the scorecard
// narrative headlines, which update after a recompute.

export default function CrossfadeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState(text);
  const [opacity, setOpacity] = useState(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (text === displayed) return;
    // Clear any in-flight transition before starting a new one
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setOpacity(0); // fade old out (150ms via transition)
    const swap = setTimeout(() => {
      setDisplayed(text);
      setOpacity(1); // fade new in (200ms via transition)
    }, 150);
    timersRef.current.push(swap);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span
      className={className}
      style={{
        opacity,
        transition: `opacity ${opacity === 0 ? 150 : 200}ms ease`,
        display: 'inline-block',
      }}
    >
      {displayed}
    </span>
  );
}
