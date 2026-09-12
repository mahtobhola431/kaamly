'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts from zero to `value` once, on mount, then stops.
 *
 * This is the only part of a stat card that needs the client, which keeps `StatCard`
 * itself a server component — important, because icon components cannot cross the
 * server/client boundary as props.
 */
export function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    // Reduced motion runs the same loop with no duration, so state is never set
    // synchronously inside the effect.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
    const start = performance.now();

    const step = (now: number): void => {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // easeOutCubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return (
    <>
      {display.toLocaleString('en-IN')}
      {suffix}
    </>
  );
}
