import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenisInstance } from '../core/lenisInstance';

interface SceneLogState {
  id: string;
  name: string;
  opacity: string;
  visibility: string;
  display: string;
  height: number;
  top: number;
  bottom: number;
  inViewport: boolean;
}

export function useRuntimeDiagnostics() {
  useEffect(() => {
    // Only run diagnostics in development — zero overhead in production
    if (!import.meta.env.DEV) return;

    const lastLoggedSceneStates: Record<string, string> = {};
    let firstBlankDetected = false;

    const scenes = [
      { id: 'arrival', name: 'Scene 1 (Arrival)', selector: '#scene-arrival' },
      { id: 'forest', name: 'Scene 2 (Forest)', selector: '#scene-forest' },
      { id: 'discovery', name: 'Scene 3 (Discovery)', selector: '#scene-discovery' },
      { id: 'harvest', name: 'Scene 4 (Harvest)', selector: '#scene-harvest' },
      { id: 'honey', name: 'Scene 4.5 (Honey)', selector: '#scene-honey' },
      { id: 'collection', name: 'Scene 5 (Collection)', selector: '#collection' },
    ];

    const intervalId = setInterval(() => {
      const scrollY = window.scrollY;
      const st = ScrollTrigger.getById('master-scroll-trigger');
      const lenis = getLenisInstance();

      let stProgress = 0;
      let tlProgress = 0;
      let stStart = 0;
      let stEnd = 0;

      if (st) {
        stProgress = parseFloat(st.progress.toFixed(4));
        stStart = Math.round(st.start);
        stEnd = Math.round(st.end);
        if (st.animation) {
          tlProgress = parseFloat(st.animation.progress().toFixed(4));
        }
      }

      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const normalizedScroll = totalScroll > 0 ? parseFloat((scrollY / totalScroll).toFixed(4)) : 0;

      const lenisScroll = lenis ? parseFloat(lenis.scroll.toFixed(1)) : scrollY;
      const lenisTarget = lenis && 'targetScroll' in lenis ? parseFloat(String(lenis.targetScroll)) : scrollY;

      // Sticky Viewport element
      const stickyEl = document.querySelector('.experience-shell > div > div') as HTMLElement | null;
      const stickyCs = stickyEl ? window.getComputedStyle(stickyEl) : null;
      const stickyOpacity = stickyCs ? parseFloat(stickyCs.opacity).toFixed(2) : '1.0';
      const stickyVisibility = stickyCs ? stickyCs.visibility : 'visible';
      const stickyRect = stickyEl ? stickyEl.getBoundingClientRect() : null;

      const currentSceneStates: SceneLogState[] = [];

      scenes.forEach(s => {
        const el = document.querySelector(s.selector) as HTMLElement | null;
        if (!el) {
          currentSceneStates.push({
            id: s.id,
            name: s.name,
            opacity: '0.00',
            visibility: 'hidden',
            display: 'none',
            height: 0,
            top: 0,
            bottom: 0,
            inViewport: false,
          });
          return;
        }

        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const op = parseFloat(cs.opacity);
        const inVp = rect.bottom > 0 && rect.top < window.innerHeight;

        currentSceneStates.push({
          id: s.id,
          name: s.name,
          opacity: op.toFixed(2),
          visibility: cs.visibility,
          display: cs.display,
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          inViewport: inVp,
        });

        // Detect opacity change for this scene
        const oldOp = lastLoggedSceneStates[s.name];
        const newOp = op.toFixed(2);
        if (oldOp !== undefined && Math.abs(parseFloat(oldOp) - parseFloat(newOp)) >= 0.15) {
          console.log(
            `%c[SCENE OPACITY TWEEN]%c SCENE: ${s.name} | OLD: ${oldOp} -> NEW: ${newOp} | TL PROGRESS: ${tlProgress} | SCROLL: ${scrollY}px | ST: ${stProgress}`,
            'color: #E8B44D; font-weight: bold;',
            'color: #E0E2DC;'
          );
          lastLoggedSceneStates[s.name] = newOp;
        } else if (oldOp === undefined) {
          lastLoggedSceneStates[s.name] = newOp;
        }
      });

      // Periodic check for handoff points between 0.93 and 1.00
      if (tlProgress >= 0.93 && tlProgress <= 1.0) {
        const honeyState = currentSceneStates.find(s => s.id === 'honey');
        const colState = currentSceneStates.find(s => s.id === 'collection');
        if (honeyState && colState) {
          // Log handoff geometry every 500ms
          if (Date.now() % 500 < 100) {
            console.log(
              `%c[HANDOFF MONITOR]%c TL: ${tlProgress} | ScrollY: ${scrollY} | HoneyOp: ${honeyState.opacity} | StickyOp: ${stickyOpacity} | ColOp: ${colState.opacity} | ColTop: ${colState.top} | ColInVp: ${colState.inViewport} | ST End: ${stEnd}`,
              'color: #64B5F6; font-weight: bold;',
              'color: #E0E2DC;'
            );
          }
        }
      }

      // Determine EXPECTED ACTIVE SCENE based on timeline progress
      // 0.00 - 0.15 -> arrival
      // 0.10 - 0.30 -> forest
      // 0.24 - 0.55 -> discovery
      // 0.50 - 0.75 -> harvest
      // 0.68 - 0.98 -> honey
      // >= 0.95 -> collection (handoff zone)
      let isVisibleScenePresent = false;

      if (tlProgress < 0.95) {
        // Sticky viewport must be visible AND at least one expected scene in the viewport must have opacity > 0.05
        const stickyVisible = parseFloat(stickyOpacity) > 0.05 && stickyVisibility !== 'hidden';
        const activeScene = currentSceneStates.find(s => {
          if (s.id === 'collection') return false;
          const op = parseFloat(s.opacity);
          return s.inViewport && op > 0.05 && s.visibility !== 'hidden' && s.display !== 'none';
        });
        isVisibleScenePresent = stickyVisible && !!activeScene;
      } else {
        // In the handoff zone (0.95 -> 1.00) or beyond
        // Either the honey scene inside sticky viewport is visible OR the Collection section is in viewport with opacity > 0.05
        const honeyState = currentSceneStates.find(s => s.id === 'honey');
        const honeyVisible = honeyState && honeyState.inViewport && parseFloat(honeyState.opacity) > 0.05 && parseFloat(stickyOpacity) > 0.05;

        const colState = currentSceneStates.find(s => s.id === 'collection');
        const colVisible = colState && colState.inViewport && parseFloat(colState.opacity) > 0.05 && colState.visibility !== 'hidden' && colState.display !== 'none';

        isVisibleScenePresent = !!(honeyVisible || colVisible);
      }

      // TRUE BLANK FRAME DETECTION
      if (!isVisibleScenePresent && !firstBlankDetected) {
        firstBlankDetected = true;
        const colEl = document.getElementById('collection');
        const colRect = colEl ? colEl.getBoundingClientRect() : null;

        console.group('%c[CRITICAL: TRUE BLANK FRAME DETECTED]', 'background: #B33927; color: #fff; padding: 4px; font-weight: bold;');
        console.warn({
          timestamp: new Date().toISOString(),
          scrollY,
          normalizedScroll,
          masterTimelineProgress: tlProgress,
          scrollTriggerProgress: stProgress,
          scrollTriggerBounds: { start: stStart, end: stEnd },
          lenisState: { current: lenisScroll, target: lenisTarget },
          stickyViewport: {
            opacity: stickyOpacity,
            visibility: stickyVisibility,
            rect: stickyRect,
          },
          collectionSection: {
            rect: colRect,
            inViewport: colRect ? colRect.bottom > 0 && colRect.top < window.innerHeight : false,
          },
          diagnosticQuestions: {
            '1. Is the viewport opacity 0?': stickyOpacity === '0.00',
            '2. Are all scenes opacity 0?': currentSceneStates.every(s => parseFloat(s.opacity) === 0),
            '3. Is active scene outside viewport?': !currentSceneStates.some(s => s.inViewport && parseFloat(s.opacity) > 0.05),
            '4. Is active scene height 0?': currentSceneStates.some(s => s.height === 0),
            '5. Detailed scene states': currentSceneStates,
          }
        });
        console.groupEnd();
      } else if (isVisibleScenePresent && firstBlankDetected) {
        firstBlankDetected = false;
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);
}
