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
 * Scroll to a percentage position using Lenis's proper API.
 *
 * This REPLACES all `window.scrollTo()` calls in navigation components.
 *
 * @param pct                  - Scroll percentage (0.0 = top, 1.0 = bottom)
 * @param immediate            - If true, jump instantly without animation
 * @param sceneManagerRelative - If true, resolve pct relative to SceneManager height
 *                               (750vh = window.innerHeight * 7.5) instead of the full
 *                               document scrollHeight. Use this for all cinematic scene
 *                               nav links where the masterTimeline 0.0–1.0 range maps to
 *                               the 750vh SceneManager container, NOT the full page.
 *                               DEFAULT: false (uses total document scrollHeight).
 */
export function scrollToPercent(pct: number, immediate = false, sceneManagerRelative = false): void {
  let maxScroll: number;

  if (sceneManagerRelative) {
    // SceneManager is 800vh. masterTimeline 0.0–1.0 maps to this range.
    maxScroll = window.innerHeight * 8.0; // 800vh
  } else {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }

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
 * Uses ONLY lenis.stop() which adds the `.lenis-stopped` CSS class to <html>.
 * The `.lenis-stopped { overflow: hidden }` rule in index.css handles the
 * visual scroll lock — no direct DOM style manipulation needed.
 *
 * IMPORTANT: Do NOT call document.body.style.overflow = 'hidden' here.
 * That bypasses Lenis and causes the scroll-lock bug where the page remains
 * stuck even after the modal is closed.
 */
export function pauseLenis(): void {
  if (_lenis) {
    _lenis.stop();
  }
}

/**
 * Resume Lenis smooth scrolling (e.g. when an overlay/modal is closed).
 */
export function resumeLenis(): void {
  if (_lenis) {
    _lenis.start();
  }
  // Ensure body overflow is never left in a stuck state
  // (defensive cleanup only — not the primary lock mechanism)
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
  }
}

