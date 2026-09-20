import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user's OS/browser has requested reduced motion
 * via `prefers-reduced-motion: reduce`.
 *
 * When true, scenes gracefully skip GSAP timelines and immediately set
 * all elements to their final visible state (opacity: 1, y: 0, etc.)
 * so content is never hidden or clipped for accessibility users.
 *
 * Subscribes to live changes — if the user toggles the setting while the
 * page is open the hook re-fires and all consumers re-render immediately.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // SSR-safe: initialise from the media query on first render
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Sync in case the value changed between first render and effect mount
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
