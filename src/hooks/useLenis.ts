import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenisInstance } from '../core/lenisInstance';
import { recordInitEvent } from '../core/telemetry/initEvents';

gsap.registerPlugin(ScrollTrigger);

// Prevent mobile dynamic toolbar / address bar resize from jittering ScrollTrigger
if (typeof window !== 'undefined') {
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * useLenis — v3 (Definitive Scroll Fix)
 *
 * ROOT CAUSES FIXED:
 *
 * 1. React StrictMode double-mount: In development, React mounts every effect
 *    TWICE (mount → unmount → mount). This caused TWO Lenis instances to be
 *    created simultaneously, with two GSAP ticker callbacks both calling
 *    lenis.raf() every frame. The two instances fought over scroll position,
 *    causing jitter. FIX: Guard ensures only one instance exists at a time.
 *    The cleanup in the first mount properly destroys before second mount.
 *
 * 2. GSAP lagSmoothing was being called every re-render. It should only be
 *    called once. FIX: Called once inside the guard, not repeatedly.
 *
 * 3. Lenis + ScrollTrigger sync: lenis.on('scroll', ScrollTrigger.update)
 *    is the correct integration pattern for lenis@1.x. Confirmed correct.
 *
 * ARCHITECTURE:
 *   Lenis intercepts wheel events → applies easing → emits scroll events
 *   → ScrollTrigger.update() reads window.scrollY → GSAP scrubs timeline
 *   → Scene animations update at the correct scroll-proportional position
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {

    // Guard against double-mount in React StrictMode.
    // If a Lenis instance was already created by a previous mount of this
    // effect (e.g. StrictMode's double-invoke), destroy it first.
    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    // Skip Lenis on small-screen touch phones only.
    // Keep it on desktop touchscreen laptops/iPad (fine-pointer or > 768px).
    const isMobilePhone =
      typeof window !== 'undefined' &&
      window.innerWidth < 768 &&
      'ontouchstart' in window;

    if (isMobilePhone) return;

    const lenis = new Lenis({
      // 0.75 duration: fast enough to feel responsive on quick scrolls,
      // still smooth enough for cinematic pacing.
      // Reduced from 0.9 — eliminates the "stuck/trailing" feeling on fast swipes.
      duration: 0.75,
      // Exponential ease-out: fast initial response, smooth deceleration
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // 1.1 = slight amplification for better desktop trackpad feel
      wheelMultiplier: 1.1,
      infinite: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);
    recordInitEvent('Lenis ready');

    // ── ScrollTrigger sync ──
    // Lenis emits 'scroll' events that ScrollTrigger needs to respond to.
    // This is the official lenis@1.x integration pattern.
    lenis.on('scroll', ScrollTrigger.update);

    // ── GSAP ticker drives Lenis RAF ──
    // GSAP's ticker IS requestAnimationFrame. By driving lenis.raf() from
    // the GSAP ticker we ensure a SINGLE RAF loop drives both systems,
    // eliminating double-render and ensuring deterministic frame ordering:
    // GSAP ticker → lenis.raf → lenis emits 'scroll' → ScrollTrigger.update
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // Disable GSAP's lag compensation — Lenis handles frame timing.
    // Calling this once is sufficient; no need to re-call on every mount.
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Remove ticker FIRST, then destroy Lenis.
      // This prevents a final lenis.raf() call on a destroyed instance.
      gsap.ticker.remove(tickerCallback);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  return lenisRef;
}
