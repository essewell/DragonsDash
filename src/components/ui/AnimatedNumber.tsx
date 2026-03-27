"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from `from` to `to` over `duration` ms.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function useAnimatedNumber(
  value: number,
  duration: number = 600,
): number {
  const [displayed, setDisplayed] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(value);
  const toRef = useRef(value);

  useEffect(() => {
    fromRef.current = displayed;
    toRef.current = value;
    startRef.current = performance.now();

    const animate = (now: number) => {
      if (!startRef.current) return;

      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplayed(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return displayed;
}

interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCurrency({
  value,
  currency = "CAD",
  className,
  duration = 600,
}: AnimatedCurrencyProps) {
  const animated = useAnimatedNumber(value, duration);

  return (
    <span className={className}>
      {new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency,
      }).format(animated)}
    </span>
  );
}
