import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { SceneContext } from './SceneContext';
import { recordInitEvent } from '../telemetry/initEvents';

const SCENE_NAMES: Record<string, string> = {
  arrival: 'Scene1 registered',
  forest: 'Scene2 registered',
  discovery: 'Scene3 registered',
  harvest: 'Scene4 registered',
  honey: 'Scene4.5 registered',
  environment: 'Environment registered',
};

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
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const registeredScenesRef = useRef<Set<string>>(new Set());

  // ── AUTHORITATIVE SYNC ──────────────────────────────────────────────────────
  // Called ONCE, after the Preloader's ScrollTrigger.refresh() completes.
  // Does NOT call ScrollTrigger.refresh() itself — that is the Preloader's job.
  // Only reads the current ST progress (post-refresh) and snaps the timeline.
  const syncTimeline = useCallback(() => {
    requestAnimationFrame(() => {
      const st = ScrollTrigger.getById('master-scroll-trigger');
      const progress = st ? st.progress : 0;
      if (timelineRef.current) {
        timelineRef.current.progress(progress);
        timelineRef.current.render(timelineRef.current.time(), false, true);
        const actualProgress = timelineRef.current.progress();
        recordInitEvent('[POPS INIT] timeline sync', {
          scrollY: window.scrollY,
          progress,
          timelineProgress: actualProgress,
        });
        if (import.meta.env.DEV) {
          console.log(
            `%c[POPS INIT] timeline sync%c scrollY=${Math.round(window.scrollY)} progress=${progress.toFixed(4)} timelineProgress=${actualProgress.toFixed(4)}`,
            'color: #10B981; font-weight: bold;',
            'color: #E0E2DC;'
          );
        }
      }
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('pride:timeline-synced', { detail: { progress } })
        );
      }
    });
  }, []);

  // ── SCENE REGISTRATION ───────────────────────────────────────────────────────
  // Registers the scene ID only. Does NOT trigger any scroll/timeline sync.
  // Sync happens once after the Preloader's authoritative ScrollTrigger.refresh().
  const registerScene = useCallback(
    (id: string) => {
      registeredScenesRef.current.add(id);
      const eventName = SCENE_NAMES[id] || `Scene ${id} registered`;
      recordInitEvent(eventName);
    },
    []
  );

  const unregisterScene = useCallback((id: string) => {
    registeredScenesRef.current.delete(id);
  }, []);

  // ── MASTER TIMELINE CREATION ─────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'master-scroll-trigger',
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        },
        defaults: { ease: 'none' },
      });

      // 0 to 1 timeline mapping — all scene tweens insert into this range
      tl.to({}, { duration: 1.0 });
      timelineRef.current = tl;
      setMasterTimeline(tl);
      recordInitEvent('master timeline created');
    }, containerRef);

    return () => {
      ctx.revert();
      timelineRef.current = null;
      setMasterTimeline(null);
      registeredScenesRef.current.clear();
    };
  }, []);

  // ── AUTHORITATIVE REFRESH LISTENER ──────────────────────────────────────────
  // Listens for 'pride:refresh-complete' dispatched by Preloader after its
  // final ScrollTrigger.refresh(). This is the ONE authoritative sync event.
  // No premature sync fires before this — registerScene() no longer calls syncTimeline().
  useEffect(() => {
    const handleRefreshComplete = () => {
      recordInitEvent('[POPS INIT] refresh complete (handling pride:refresh-complete)');
      if (import.meta.env.DEV) {
        console.log(
          '%c[POPS INIT] refresh complete%c → triggering authoritative timeline sync',
          'color: #10B981; font-weight: bold;',
          'color: #E0E2DC;'
        );
      }
      syncTimeline();
    };
    window.addEventListener('pride:refresh-complete', handleRefreshComplete);
    return () => window.removeEventListener('pride:refresh-complete', handleRefreshComplete);
  }, [syncTimeline]);

  // ── RESIZE HANDLER ────────────────────────────────────────────────────────────
  // orientationchange is NOT listed here — ScrollTrigger.config({ ignoreMobileResize: true })
  // already handles mobile toolbar show/hide and orientation events. Adding it here
  // would risk firing a refresh at the Collection handoff boundary on mobile.
  //
  // STAGE 1 FIX: Guard the refresh so it is skipped when master timeline progress > 0.85.
  // At that point the sticky container is approaching or has reached the Collection handoff.
  // A refresh in this zone recalculates st.end using Collection's newly-rendered DOM height,
  // making (scrollY / newEnd) < 1.0 and driving the scrub timeline backward — causing the
  // visual re-entry of Honey/earlier scenes observed in the failure video.
  useEffect(() => {
    let rafId: number;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const onResize = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // ── HANDOFF GUARD ───────────────────────────────────────────────
            // Skip if master timeline has passed the Collection handoff zone.
            // Refreshing here would cause (scrollY / newEnd) < 1.0 and push
            // the scrub timeline backward, visually re-entering earlier scenes.
            const st = ScrollTrigger.getById('master-scroll-trigger');
            const progress = st ? st.progress : 0;

            if (progress > 0.85) return;

            ScrollTrigger.refresh();
          });
        });
      }, 150);
    };

    window.addEventListener('resize', onResize, { passive: true });
    // orientationchange deliberately omitted — covered by ignoreMobileResize: true

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(debounceTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <SceneContext.Provider
      value={{
        masterTimeline,
        registerScene,
        unregisterScene,
        syncTimeline,
      }}
    >
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: scrollHeight, background: '#021A0A' }}
      >
        {/* 100dvh sticky viewport — all cinematic scenes animate inside this. */}
        <div
          ref={stickyRef}
          className="sticky top-0 left-0 w-full overflow-hidden"
          style={{
            height: '100dvh',
            background: '#021A0A',
            opacity: 1,
            visibility: 'visible',
          }}
        >
          {children}
        </div>
      </div>
    </SceneContext.Provider>
  );
}
