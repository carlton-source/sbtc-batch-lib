import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` using requestAnimationFrame.
 * Only starts once `shouldStart` becomes true. Fires once per mount.
 *
 * @param target    Final numeric value
 * @param duration  Animation duration in ms (default 1200)
 * @param shouldStart Trigger — animation begins when this becomes true
 * @param delay     Optional delay in ms before the animation starts
 */
export function useCountUp(
  target: number,
  duration = 1200,
  shouldStart = false,
  delay = 0
): number {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    if (target === 0) {
      setCount(0);
      startedRef.current = true;
      return;
    }

    startedRef.current = true;

    const run = () => {
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(eased * target);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(run, delay);
    } else {
      run();
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [shouldStart, target, duration, delay]);

  return count;
}
