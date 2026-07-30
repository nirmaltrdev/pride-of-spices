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
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const bgRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !bgRef.current) return;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Background parallax push throughout entire journey (0-100%)
      masterTimeline.to(bgRef.current, {
        scale: 1.2,
        y: '-10%',
        duration: 1.0,
        ease: 'none'
      }, 0);

      // 2. Colour temperature journey
      // Neutral midday (at 30% scroll)
      masterTimeline.to(atmosphereRef.current, {
        backgroundColor: 'rgba(212, 147, 42, 0.18)',
        duration: 0.25,
        ease: 'power1.inOut'
      }, 0.30);

      // Golden afternoon (at 55% scroll)
      masterTimeline.to(atmosphereRef.current, {
        backgroundColor: 'rgba(201, 140, 30, 0.28)',
        duration: 0.15,
        ease: 'power1.inOut'
      }, 0.60);

      // Warm amber (at 70% scroll)
      masterTimeline.to(atmosphereRef.current, {
        backgroundColor: 'rgba(180, 100, 15, 0.35)',
        duration: 0.12,
        ease: 'power1.inOut'
      }, 0.70);

      // Transition smoothly to dark forest background (#030703 / rgba(3, 7, 3, 0.95)) up to 1.00
      masterTimeline.to(atmosphereRef.current, {
        backgroundColor: 'rgba(3, 7, 3, 0.95)',
        duration: 0.10,
        ease: 'power2.inOut'
      }, 0.90);

      // 3. Fog lifecycle
      // Thins as we enter the forest (0-20%)
      masterTimeline.to(fogRef.current, {
        opacity: 0.05,
        duration: 0.2,
        ease: 'power1.out'
      }, 0.10);

      // Returns slightly at dusk for Collection transition
      masterTimeline.to(fogRef.current, {
        opacity: 0.35,
        duration: 0.18,
        ease: 'power1.in'
      }, 0.78);
    });

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-charcoal"
      aria-hidden="true"
    >
      {/* Base Forest Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 origin-bottom will-change-transform"
      >
        <CinematicImage 
          asset={Assets.forestMistBg} 
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        />
      </div>

      {/* Dynamic Fog Layer */}
      <div
        ref={fogRef}
        className="absolute inset-0 will-change-opacity"
        style={{
          background: 'linear-gradient(to bottom, rgba(220,230,210,0.4) 0%, rgba(200,215,195,0.2) 30%, transparent 70%)',
          opacity: prefersReducedMotion ? 0.2 : 0.8
        }}
      />

      {/* Atmospheric Colour Temperature Overlay */}
      <div
        ref={atmosphereRef}
        className="absolute inset-0 will-change-auto mix-blend-multiply"
        style={{ backgroundColor: 'rgba(180, 210, 230, 0.18)' }}
      />
    </div>
  );
}
