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
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SCENE_REGISTRY } from './sceneRegistry';

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
 * Scroll to a target in pixels or scene hold point with distance-proportional easing.
 */
export function scrollToPixels(targetPx: number, immediate = false, duration?: number): void {
  const currentY = window.scrollY;
  const distance = Math.abs(targetPx - currentY);
  
  // Distance-proportional duration (between 0.8s and 2.2s) with gentle luxury easing
  const calculatedDuration = immediate ? 0 : (duration ?? Math.max(0.8, Math.min(2.2, 0.6 + (distance / 4000))));

  if (_lenis) {
    _lenis.scrollTo(targetPx, {
      duration: calculatedDuration,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      immediate,
    });
  } else {
    window.scrollTo({
      top: targetPx,
      behavior: immediate ? 'auto' : 'smooth',
    });
  }
}

/**
 * Scroll to a scene by its logical ID (defined in sceneRegistry).
 */
export function scrollToScene(sceneId: string, immediate = false, duration?: number): void {
  if (sceneId === 'collection') {
    const collectionEl = document.getElementById('collection');
    if (collectionEl) {
      const top = collectionEl.getBoundingClientRect().top + window.scrollY;
      scrollToPixels(top, immediate, duration);
      return;
    }
  }

  const scene = SCENE_REGISTRY.find(s => s.id === sceneId);
  if (!scene) return;

  // Derive target position from real master ScrollTrigger bounds
  const st = ScrollTrigger.getById('master-scroll-trigger');
  if (st) {
    const totalDist = st.end - st.start;
    const targetPx = Math.round(st.start + scene.holdPoint * totalDist);
    scrollToPixels(targetPx, immediate, duration);
  } else {
    // Fallback if ScrollTrigger hasn't refreshed yet
    const sceneManagerEl = document.querySelector('.experience-shell');
    const height = sceneManagerEl ? sceneManagerEl.clientHeight - window.innerHeight : window.innerHeight * 7;
    const targetPx = Math.round(scene.holdPoint * height);
    scrollToPixels(targetPx, immediate, duration);
  }
}

/**
 * Scroll to a timeline progress fraction (0.0 to 1.0) on the cinematic master timeline.
 */
export function scrollToTimelineProgress(progress: number, immediate = false, duration?: number): void {
  const st = ScrollTrigger.getById('master-scroll-trigger');
  if (st) {
    const totalDist = st.end - st.start;
    const targetPx = Math.round(st.start + Math.max(0, Math.min(1, progress)) * totalDist);
    scrollToPixels(targetPx, immediate, duration);
  } else {
    const targetPx = Math.round(Math.max(0, Math.min(1, progress)) * window.innerHeight * 7);
    scrollToPixels(targetPx, immediate, duration);
  }
}

/**
 * Backward compatibility wrapper for scrollToPercent
 */
export function scrollToPercent(pct: number, immediate = false, sceneManagerRelative = false): void {
  if (pct === 0) {
    scrollToPixels(0, immediate);
    return;
  }
  if (sceneManagerRelative) {
    scrollToTimelineProgress(pct, immediate);
  } else {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollToPixels(Math.round(maxScroll * pct), immediate);
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

