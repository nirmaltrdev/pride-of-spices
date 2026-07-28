import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';

/**
 * SCENE MANAGER — Version 2 (Fixed Timeline Architecture)
 *
 * Creates a massive scrollable container and a single GSAP master timeline
 * synced to scroll position via ScrollTrigger.scrub.
 *
 * Key architectural decisions:
 * 1. The master timeline is pinned to exactly 1 second of duration
 *    using a spacer animation. This ensures scene time positions
 *    (0.15, 0.32, etc.) map directly to scroll percentage.
 * 2. Scenes inject their sub-timelines at fractional time positions
 *    corresponding to their scroll percentage entry points.
 * 3. scrub: 1.8 gives cinematic inertia without being too laggy.
 */
export function SceneManager({ children, scrollHeight = '1200vh' }: { children: React.ReactNode, scrollHeight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [masterTimeline, setMasterTimeline] = useState<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Create the master timeline with ScrollTrigger scrub
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          // On mobile, Lenis is disabled so native scroll drives ScrollTrigger.
          // Use a tight scrub so cinematic scenes track finger movement closely.
          scrub: isTouchDevice ? 0.4 : 1.2,
        },
        defaults: { ease: 'none' },
      });

      // Anchor the timeline to exactly 1.0 duration using a spacer
      // This maps: position 0.0 = 0% scroll, 1.0 = 100% scroll
      // Scenes can add their sub-timelines at positions 0.0 - 1.0
      tl.to({}, { duration: 1.0 }); // Spacer — defines total duration

      setMasterTimeline(tl);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <SceneContext.Provider value={{ masterTimeline }}>
      {/* 
        The massive scroll container. 
        Height determines the total length of the cinematic experience.
        All visual scenes are `position: sticky` inside.
      */}
      <div
        ref={containerRef}
        className="relative w-full bg-charcoal"
        style={{ height: scrollHeight }}
      >
        {/* Sticky viewport — keeps scenes fixed while scroll drives the timeline */}
        <div
          className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-charcoal"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </SceneContext.Provider>
  );
}
