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
  const getMotionPreference = (): boolean => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('motion') === 'full' || params.get('reduceMotion') === '0') return false;
    if (params.get('motion') === 'reduce' || params.get('reduceMotion') === '1') return true;
    const stored = localStorage.getItem('pride_reduced_motion');
    if (stored === 'false') return false;
    if (stored === 'true') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getMotionPreference);

  useEffect(() => {
    const update = () => {
      setPrefersReducedMotion(getMotionPreference());
    };

    update();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'pride_reduced_motion') update();
    };

    mediaQuery.addEventListener('change', update);
    window.addEventListener('storage', storageHandler);
    window.addEventListener('pride:motion-change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('pride:motion-change', update);
    };
  }, []);

  return prefersReducedMotion;
}
