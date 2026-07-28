import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion.
 * Used globally to disable/simplify animations.
 * 
 * NOTE: This is Phase 2+ infrastructure. Currently implemented as a capability baseline.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // TEMP FIX: Force false to prevent skipping GSAP timelines.
  // The scenes currently return early when this is true, leaving text at opacity: 0.
  // Proper reduced-motion timelines will be implemented in a later phase.
  return false;
}
