import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';

/**
 * SCENE MANAGER — Version 3 (Production Stability)
 *
 * Key improvements:
 * - invalidateOnRefresh: true — recomputes bounds after image loads / resize
 * - 100dvh sticky viewport — prevents CLS from mobile toolbar collapse
 * - Debounced resize + orientationchange → ScrollTrigger.refresh()
 * - React Strict Mode safe: kills stale triggers before recreating
 */
export function SceneManager({ children, scrollHeight = '1200vh' }: { children: React.ReactNode, scrollHeight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [masterTimeline, setMasterTimeline] = useState<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      tl.to({}, { duration: 1.0 });
      setMasterTimeline(tl);
    }, containerRef);

    return () => {
      ctx.revert();
      setMasterTimeline(null);
    };
  }, []);

  // Debounced resize + orientation handler — keeps ScrollTrigger bounds accurate
  useEffect(() => {
    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
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
        {/* 100dvh: uses dynamic viewport height — prevents mobile toolbar CLS */}
        <div
          className="sticky top-0 left-0 w-full overflow-hidden bg-charcoal"
          style={{
            height: '100dvh',
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

