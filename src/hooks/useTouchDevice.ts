import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user is on a touch device.
 * 
 * Uses matchMedia with (hover: none) and (pointer: coarse) to detect
 * devices where the primary input mechanism is touch.
 * Useful for adjusting hover states, interaction prompts, and easing parameters.
 * 
 * NOTE: This is Phase 2+ infrastructure. Currently implemented as a capability baseline.
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    setIsTouchDevice(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setIsTouchDevice(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isTouchDevice;
}
