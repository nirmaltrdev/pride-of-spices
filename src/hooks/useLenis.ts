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
 * duration: 1.2 — balanced inertia; responsive without overshooting
 * easing: exponential ease-out — ultra-smooth deceleration
 * smoothWheel: true — intercepts wheel events for smooth desktop scroll
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Skip Lenis only on small-screen mobile devices.
    // This avoids disabling Lenis on desktop touchscreen laptops.
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768 && 'ontouchstart' in window;
    if (isMobileDevice) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Register with the singleton so any module can call scrollToPercent(),
    // pauseLenis(), or resumeLenis() without prop drilling or React context.
    setLenisInstance(lenis);

    // Critical: Connect Lenis to GSAP's ticker to keep ScrollTrigger in sync.
    // This prevents the scroll jitter caused by two separate scroll loops.
    lenis.on('scroll', ScrollTrigger.update);

    // Store ticker callback reference so we can remove it on cleanup
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // Disable GSAP's default lagSmoothing since Lenis handles it
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
      // Deregister from singleton — prevents stale instance usage after cleanup
      setLenisInstance(null);
    };
  }, [prefersReducedMotion]);

  return lenisRef;
}
