import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';

/**
 * SCENE MANAGER — v7 (Blank Screen Fix: Sticky Viewport Fade-Out)
 *
 * ROOT CAUSES FIXED:
 *
 * 1. scrub: 1 caused the animation to trail 1 full second behind scroll.
 *    Combined with Lenis's own easing, the user experienced ~2s of lag.
 *    FIX: scrub: 0.15 — animation catches up in ~2 frames. Fast and cinematic.
 *
 * 2. SNAP REMOVED (was the primary source of scroll jitter):
 *    ScrollTrigger snap fires 120ms after the user pauses scrolling and
 *    forcibly tweens window.scrollY to a predetermined point. Lenis is
 *    simultaneously applying its own easing to the same scroll position.
 *    These two systems fighting over scroll position create the stutter /
 *    "fighting the mouse wheel" sensation. Removing snap gives Lenis full
 *    control and makes scrolling feel fluid and cinematic.
 *
 * 3. BLANK SCREEN FIX (sticky viewport fade-out):
 *    The sticky inner div has background #021A0A and remained OPAQUE for
 *    the full 800vh scroll height, even after all cinematic scenes had faded
 *    to opacity:0. Scene5_Collection is outside SceneManager (in natural DOM
 *    flow below it). The opaque sticky div was blocking it, causing a large
 *    blank dark section before Collection was visible.
 *    FIX: A dedicated ScrollTrigger fades stickyRef from opacity:1 → 0
 *    between 88%→96% of SceneManager progress, revealing Collection below.
 *
 * SCROLL ARCHITECTURE:
 *   The SceneManager creates an 800vh tall scroll container.
 *   The inner div is position:sticky — it stays fixed in the viewport while
 *   the user scrolls through 800vh of scroll distance.
 *   ScrollTrigger maps scroll progress (0→1) to the master timeline.
 *   scrub: N means the timeline playhead chases scroll progress over N seconds.
 *   All scenes inject their animations into this single master timeline.
 *
 * WHY TALL CONTAINER + STICKY AND NOT pin: true?
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
  const stickyRef = useRef<HTMLDivElement>(null);
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
          // scrub: 0.15 — very fast catch-up eliminates animation-behind-scroll lag.
          // At 0.15s, even fast wheel flicks are caught within ~2 frames.
          // NO snap: snap conflicted with Lenis causing visible jitter on every scroll pause.
          scrub: 0.15,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      // Placeholder to give timeline a 0→1 range
      tl.to({}, { duration: 1.0 });
      setMasterTimeline(tl);

      // ── STICKY VIEWPORT FADE-OUT ────────────────────────────────────────────
      // ROOT CAUSE: After all cinematic scenes exit at ~0.88 progress, the sticky
      // viewport div (background: #021A0A) remains OPAQUE and blocks the Collection
      // section below it in the DOM. This is why users saw a large blank dark screen
      // before "The Collection" heading appeared.
      //
      // FIX: A separate ScrollTrigger fades the entire sticky viewport to opacity:0
      // between 88%→96% of the SceneManager container's scroll travel.
      // Once transparent, the Collection section (in natural page flow below) shows
      // through. The fade mirrors Scene4_5's own exit timing for a seamless handoff.
      if (stickyRef.current) {
        gsap.fromTo(
          stickyRef.current,
          { opacity: 1 },
          {
            opacity: 0,
            ease: 'power2.in',
            scrollTrigger: {
              trigger: containerRef.current,
              // "88% top" = when the SceneManager's 88% mark reaches the top of viewport
              start: '88% top',
              // "96% top" = fully faded by the 96% mark
              end: '96% top',
              scrub: 0.1,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, containerRef);

    return () => {
      ctx.revert();
      setMasterTimeline(null);
    };
  }, []);

  // Debounced resize + orientation handler
  useEffect(() => {
    let rafId: number;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const onResize = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(debounceTimer);
      // Debounce 150ms first, then wait two frames for layout to fully settle
      debounceTimer = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        });
      }, 150);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(debounceTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return (
    <SceneContext.Provider value={{ masterTimeline }}>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: scrollHeight, background: '#021A0A' }}
      >
        {/* 100dvh sticky viewport — scenes animate inside this fixed window.
            stickyRef is used by a dedicated ScrollTrigger to fade the entire
            viewport to opacity:0 at 88%→96% progress. This reveals the
            Collection section below in the DOM, eliminating the blank dark screen. */}
        <div
          ref={stickyRef}
          className="sticky top-0 left-0 w-full overflow-hidden"
          style={{
            height: '100dvh',
            background: '#021A0A',
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
