/**
 * LENIS SINGLETON — Module-level Lenis instance registry
 *
 * This module is the SINGLE SOURCE OF TRUTH for the active Lenis instance.
 *
 * ── WHY THIS EXISTS ──
 * The scroll-lock bug was caused by components calling `window.scrollTo()`
 * or `document.body.style.overflow` directly, bypassing Lenis. This creates
 * two competing scroll systems:
 *   1. Lenis's internal RAF-driven virtual scroll
 *   2. The browser's native scroll
 *
 * When these conflict, Lenis's internal state diverges from the real scroll
 * position, GSAP ScrollTrigger receives wrong values, and the master
 * timeline freezes at an incorrect progress point.
 *
 * ── USAGE ──
 * Navigation → scrollToPercent(pct)
 * Overlays   → pauseLenis() / resumeLenis()
 *
 * The instance is registered by useLenis() and cleaned up on destroy.
 */

import type Lenis from 'lenis';

/** The active Lenis smooth-scroll instance (null when not initialized or reduced-motion) */
let _lenis: Lenis | null = null;

/**
 * Register the active Lenis instance.
 * Called by useLenis() after creation.
 */
export function setLenisInstance(lenis: Lenis | null): void {
  _lenis = lenis;
}

/**
 * Get the active Lenis instance.
 * Returns null if Lenis is not initialized (e.g. reduced-motion mode).
 */
export function getLenisInstance(): Lenis | null {
  return _lenis;
}

/**
 * Scroll to a percentage position of the document using Lenis's proper API.
 *
 * This REPLACES all `window.scrollTo()` calls in navigation components.
 *
 * @param pct      - Scroll percentage (0.0 = top, 1.0 = bottom)
 * @param immediate - If true, jump instantly without animation
 */
export function scrollToPercent(pct: number, immediate = false): void {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.round(maxScroll * Math.max(0, Math.min(1, pct)));

  if (_lenis) {
    // Use Lenis's own scrollTo — keeps the smooth-scroll engine in sync
    _lenis.scrollTo(target, {
      // Match the Lenis instance duration / easing from useLenis
      duration: immediate ? 0 : 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      immediate,
    });
  } else {
    // Fallback: reduced-motion users, or before Lenis initializes
    window.scrollTo({
      top: target,
      behavior: immediate ? 'auto' : 'smooth',
    });
  }
}

/**
 * Pause Lenis smooth scrolling (e.g. when an overlay/modal is open).
 *
 * This REPLACES `document.body.style.overflow = 'hidden'`.
 * Lenis's stop() adds the `lenis-stopped` CSS class to <html>, which
 * applies `overflow: hidden` via the design-system CSS — keeping the
 * scroll engine consistent.
 */
export function pauseLenis(): void {
  if (_lenis) {
    _lenis.stop();
  } else {
    // Fallback: no Lenis (reduced-motion or not yet initialized)
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Resume Lenis smooth scrolling (e.g. when an overlay/modal is closed).
 *
 * This REPLACES `document.body.style.overflow = ''`.
 */
export function resumeLenis(): void {
  if (_lenis) {
    _lenis.start();
  } else {
    // Fallback: restore overflow
    document.body.style.overflow = '';
  }
}
