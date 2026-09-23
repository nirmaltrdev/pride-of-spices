import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from './SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../assets/AssetManifest';

/**
 * ENVIRONMENT CONTROLLER — Version 2 (Fixed Timeline Architecture)
 *
 * Drives the persistent atmospheric canvas beneath all scenes.
 * Uses direct masterTimeline calls (normalized 0.0-1.0 positions).
 *
 * Colour temperature journey through scroll:
 *   0.00 → Cool morning blue/grey (Scene 1: Arrival)
 *   0.30 → Neutral green forest   (Scene 2-3: Forest/Discovery)
 *   0.55 → Warm golden afternoon  (Scene 4: Harvest)
 *   0.70 → Deep amber             (Scene 4.5: Honey)
 *   0.82 → Dark night/lantern     (Scene 5: Collection)
 */
export function EnvironmentController() {
  const { masterTimeline, registerScene, unregisterScene } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const bgRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !bgRef.current) return;
    if (prefersReducedMotion) {
      registerScene('environment');
      return () => unregisterScene('environment');
    }

    const ctx = gsap.context(() => {
      // 1. Subtle background scale push throughout journey (GPU transform only)
      masterTimeline.to(bgRef.current, {
        scale: 1.12,
        y: '-6%',
        duration: 1.0,
        ease: 'none',
        force3D: true,
      }, 0);

      // 2. Atmosphere fade transitions (opacity only — no mix-blend-mode paint storms)
      masterTimeline.fromTo(atmosphereRef.current,
        { opacity: 0.2 },
        { opacity: 0.6, duration: 0.4, ease: 'power1.inOut', immediateRender: false },
        0.30
      );
      masterTimeline.to(atmosphereRef.current,
        { opacity: 0.85, duration: 0.25, ease: 'power1.inOut' },
        0.75
      );

      // 3. Fog lifecycle
      masterTimeline.to(fogRef.current, {
        opacity: 0.08,
        duration: 0.2,
        ease: 'power1.out'
      }, 0.10);

      masterTimeline.to(fogRef.current, {
        opacity: 0.3,
        duration: 0.18,
        ease: 'power1.in'
      }, 0.78);
    });

    registerScene('environment');

    return () => {
      ctx.revert();
      unregisterScene('environment');
    };
  }, [masterTimeline, prefersReducedMotion, registerScene, unregisterScene]);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ background: '#030703' }}
      aria-hidden="true"
    >
      {/* Base Neutral Dark Forest Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 origin-bottom will-change-transform"
        style={{ opacity: 0.65 }}
      >
        <CinematicImage 
          asset={Assets.forestMistBg} 
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center', filter: 'brightness(0.55) contrast(1.1)' }}
        />
      </div>

      {/* Atmospheric Neutral Dark Gradient Overlay — ensures zero bright photo bleed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,7,3,0.85) 0%, rgba(2,10,5,0.7) 40%, rgba(3,7,3,0.92) 100%)'
        }}
      />

      {/* Dynamic Fog Layer */}
      <div
        ref={fogRef}
        className="absolute inset-0 will-change-opacity"
        style={{
          background: 'linear-gradient(to bottom, rgba(160,180,165,0.18) 0%, rgba(120,150,130,0.08) 30%, transparent 70%)',
          opacity: prefersReducedMotion ? 0.05 : 0.4
        }}
      />

      {/* Warm Tone Accent Layer (GPU Opacity controlled) */}
      <div
        ref={atmosphereRef}
        className="absolute inset-0 pointer-events-none will-change-opacity"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(212, 147, 42, 0.15) 0%, transparent 70%)',
          opacity: 0.2
        }}
      />
    </div>
  );
}
