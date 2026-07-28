import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './useReducedMotion';
import { setLenisInstance } from '../core/lenisInstance';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook to initialize Lenis smooth scrolling synced with GSAP ScrollTrigger.
 * Critical: Lenis must drive ScrollTrigger's ticker to prevent double-scroll jitter.
 * Automatically disables if user prefers reduced motion.
 *
 * ── ARCHITECTURE NOTE ──
 * After creation, the Lenis instance is registered with the module-level
 * singleton in `src/core/lenisInstance.ts`. This allows navigation components
 * (CinematicNav) and modal components (ProductOverlay) to call the proper
 * Lenis API (lenis.scrollTo, lenis.stop, lenis.start) instead of using
 * window.scrollTo() or document.body.style.overflow directly — which would
 * create competing scroll systems and cause the scroll-lock bug.
 *
 * ── CINEMATIC TUNING ──
 * duration: 1.9 — heavy, luxurious inertia like a camera dolly losing momentum
 * easing: quartic ease-out — ultra-smooth deceleration
 * touchMultiplier: 2.5 — responsive on trackpad/touch without overshoot
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Detect touch/mobile device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const lenis = new Lenis({
      // On mobile use shorter duration so the cinematic scrub feels responsive
      duration: isTouchDevice ? 1.2 : 1.9,
      // Quartic ease-out: feels like a dolly with inertia gradually losing momentum
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      // Critical: enables Lenis smooth-scroll on touch/mobile devices
      smoothTouch: isTouchDevice,
      touchMultiplier: isTouchDevice ? 1.8 : 2.5,
      wheelMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    // Register with the singleton so any module can call scrollToPercent(),
    // pauseLenis(), or resumeLenis() without prop drilling or React context.
    setLenisInstance(lenis);

    // Critical: Connect Lenis to GSAP's ticker to keep ScrollTrigger in sync.
    // This prevents the scroll jitter caused by two separate scroll loops.
    lenis.on('scroll', ScrollTrigger.update);

    // Critical for mobile: prevents viewport resize (address bar show/hide) from
    // breaking the scroll scrub by normalizing the scroll position.
    ScrollTrigger.normalizeScroll(true);

    // Store ticker callback reference so we can remove it on cleanup
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // Disable GSAP's default lagSmoothing since Lenis handles it
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      // Deregister from singleton — prevents stale instance usage after cleanup
      setLenisInstance(null);
    };
  }, [prefersReducedMotion]);

  return lenisRef;
}
