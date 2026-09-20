import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';

/**
 * SCENE MANAGER — v8 (Natural Unpin Handoff)
 *
 * SCROLL ARCHITECTURE:
 *   The SceneManager creates an 800vh tall scroll container.
 *   The inner div is position:sticky — it stays fixed in the viewport while
 *   the user scrolls through 800vh of scroll distance.
 *   ScrollTrigger maps scroll progress (0→1) to the master timeline.
 *   scrub:true = animation locked precisely to scroll position (Lenis handles easing).
 *   All scenes inject their animations into this single master timeline.
 *
 * FINAL HANDOFF ARCHITECTURE (Critical):
 *   The stickyRef div NEVER fades to opacity:0.
 *   Wild Honey (Scene 4.5) remains visible through TL=1.0.
 *   At TL=1.0 the sticky container reaches the bottom of the 800vh shell
 *   and naturally unpins. Collection is rendered immediately after in normal
 *   DOM flow, so it scrolls into view with zero black frames.
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

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'master-scroll-trigger',
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          // scrub: 0.5 — adds 500ms smoothing to the timeline position relative to scroll.
          // This prevents blank frames during rapid reverse-scrolls where the scroll
          // position jumps faster than the timeline can update scene crossfades.
          // Lenis provides additional easing on top of this.
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      // 0 to 1 timeline mapping — all scene tweens insert into this range
      tl.to({}, { duration: 1.0 });
      setMasterTimeline(tl);

      // IMPORTANT: stickyRef is intentionally NOT faded here.
      // It stays at opacity:1 for the entire 800vh scroll range.
      // Wild Honey background remains visible until the sticky container
      // naturally unpins at the bottom of the 800vh shell.
      // Collection enters from below in natural document flow — no hacks needed.
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
        {/* 100dvh sticky viewport — all cinematic scenes animate inside this.
            Stays fully opaque (opacity:1) for the entire 800vh range.
            Natural unpin at bottom of container hands off to Collection below. */}
        <div
          ref={stickyRef}
          className="sticky top-0 left-0 w-full overflow-hidden"
          style={{
            height: '100dvh',
            background: '#021A0A',
            // NOTE: perspective and transformStyle:'preserve-3d' were removed.
            // These triggered GPU compositing bugs on Chrome with certain DPR/zoom
            // configurations, causing scenes to flicker/blank on reverse scroll.
            // 3D parallax effects still work via individual scene transforms.
          }}
        >
          {children}
        </div>
      </div>
    </SceneContext.Provider>
  );
}
