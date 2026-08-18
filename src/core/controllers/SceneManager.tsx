import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';

/**
 * SCENE MANAGER — v5 (Definitive Scroll Fix)
 *
 * ROOT CAUSES FIXED:
 *
 * 1. scrub: 1 caused the animation to trail 1 full second behind scroll.
 *    Combined with Lenis's own easing, the user experienced ~2s of lag.
 *    FIX: scrub: 0.5 — animation catches up in 0.5s. Fast enough to feel
 *    responsive, slow enough to feel cinematic.
 *
 * 2. The snap delay of 0.18s was appropriate but snap duration max of 1.0
 *    was too long and made the snap itself feel slow. FIX: max: 0.65.
 *
 * 3. ScrollTrigger.refresh() after Preloader was racing with Lenis init.
 *    FIX: Handled in Preloader with a proper delay.
 *
 * SCROLL ARCHITECTURE:
 *   The SceneManager creates a tall (800vh) scroll container.
 *   The inner div is position:sticky — it stays fixed in the viewport while
 *   the user scrolls through 800vh of scroll distance.
 *   ScrollTrigger maps the scroll progress (0 → 1) to the master timeline.
 *   scrub: N means the timeline playhead chases the scroll progress over N seconds.
 *   All scenes inject their animations into this single master timeline.
 *
 * WHY 800vh AND NOT pin: true?
 *   We use a tall container + sticky div instead of ScrollTrigger's pin because:
 *   - pin: true changes document height via pinSpacing, which conflicts with Lenis
 *   - Our sticky approach gives Lenis accurate scroll height from the start
 *   - No pinSpacing re-layout issues on resize
 */
export function SceneManager({
  children,
  scrollHeight = '800vh',
}: {
  children: React.ReactNode;
  scrollHeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [masterTimeline, setMasterTimeline] = useState<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Kill any stale ScrollTriggers from a previous mount (React StrictMode)
    ScrollTrigger.getAll().forEach(t => t.kill());

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          // scrub: 0.5 — animation catches up to scroll in 0.5 seconds.
          // This is the sweet spot: feels responsive but not instant.
          // scrub: 0 = instant (robotic), scrub: 1+ = laggy/stuck feeling.
          scrub: 0.5,
          snap: {
            // Snap points for 6 scene folds in the 800vh container
            snapTo: [0.0, 0.18, 0.40, 0.60, 0.77, 1.0],
            // Duration: how long the snap animation takes to complete
            duration: { min: 0.4, max: 0.65 },
            // Delay: wait for Lenis easing to settle (~300ms) before snapping
            delay: 0.25,
            ease: 'power2.inOut',
          },
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      // Placeholder to give timeline a 0→1 range
      tl.to({}, { duration: 1.0 });
      setMasterTimeline(tl);
    }, containerRef);

    return () => {
      ctx.revert();
      setMasterTimeline(null);
    };
  }, []);

  // Debounced resize + orientation handler
  useEffect(() => {
    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      // Double-RAF: wait two frames for layout to fully settle after resize
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return (
    <SceneContext.Provider value={{ masterTimeline }}>
      <div
        ref={containerRef}
        className="relative w-full bg-charcoal"
        style={{ height: scrollHeight }}
      >
        {/* 100dvh sticky viewport — scenes animate inside this fixed window */}
        <div
          className="sticky top-0 left-0 w-full overflow-hidden bg-charcoal"
          style={{
            height: '100dvh',
            // 3D context for parallax depth
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {children}
        </div>
      </div>
    </SceneContext.Provider>
  );
}
