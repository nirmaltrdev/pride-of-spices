import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/**
 * SCENE 2: THE LIVING FOREST — Cinematic Redesign
 *
 * Architecture:
 *   Layer 0: Solid dark forest base (prevents transparent PNG bleed)
 *   Layer 1: forest_mist_background.jpg — the hero aerial forest shot (full screen)
 *   Layer 2: Atmospheric gradient vignette (depth & cinema feel)
 *   Layer 3: forest_canopy.png silhouette (frames the top)
 *   Layer 4: mid_ground_vegetation.png (frames left/right — the "tunnel" effect)
 *   Layer 5: Volumetric light rays
 *   Layer 6: Atmospheric mist/haze
 *   Layer 7: Narrative text
 *
 * Timeline positions:
 *   0.12 → Scene fades in, background visible immediately
 *   0.14 → Canopy and vegetation frame sweeps in
 *   0.20 → Narrative stanza fades in
 *   0.26 → Stanza fades out
 *   0.29 → Scene exits
 */
export function Scene2_Forest() {
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const sceneRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgScaleRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const canopyRef = useRef<HTMLDivElement>(null);
  const midVegRef = useRef<HTMLDivElement>(null);
  const lightRay1Ref = useRef<HTMLDivElement>(null);
  const lightRay2Ref = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const stanzaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // Initialize at opacity 0 — timeline controls reveal
      gsap.set(sceneRef.current, { opacity: 0, pointerEvents: 'none' });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.04 }, 0.11);
        masterTimeline.to(sceneRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.03 }, 0.28);
        return;
      }

      // === ENTRY: Scene crossfades in at 10% scroll — full overlap with Scene1 ===
      masterTimeline.fromTo(sceneRef.current,
        { opacity: 0, pointerEvents: 'none' },
        { opacity: 1, pointerEvents: 'auto', duration: 0.08, ease: 'power2.inOut' },
        0.10
      );

      // === BACKGROUND: Cinematic dolly-push into forest (GPU transform only) ===
      masterTimeline.fromTo(bgScaleRef.current,
        { scale: 1.08, opacity: 0.7 },
        { scale: 1.0, opacity: 1, duration: 0.08, ease: 'power2.out', force3D: true },
        0.10
      );
      // Slow continuous push through the forest
      masterTimeline.to(bgScaleRef.current, {
        scale: 1.12, y: '-4%', duration: 0.18, ease: 'none', force3D: true
      }, 0.14);

      // === CANOPY: Drops in from above ===
      masterTimeline.fromTo(canopyRef.current,
        { y: '-25%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.08, ease: 'power2.out', force3D: true },
        0.11
      );

      // === MID VEGETATION: Frames left/right ===
      masterTimeline.fromTo(midVegRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 0.08, ease: 'power2.out', force3D: true },
        0.11
      );

      // === VIGNETTE: Cinema depth ===
      masterTimeline.fromTo(vignetteRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, ease: 'power1.out' },
        0.11
      );

      // === VOLUMETRIC LIGHT RAYS ===
      masterTimeline.fromTo(lightRay1Ref.current,
        { opacity: 0, x: '-8%' },
        { opacity: 1, x: '0%', duration: 0.08, ease: 'power2.out' },
        0.12
      );
      masterTimeline.fromTo(lightRay2Ref.current,
        { opacity: 0, x: '8%' },
        { opacity: 1, x: '0%', duration: 0.08, ease: 'power2.out' },
        0.13
      );

      // === ATMOSPHERIC MIST ===
      masterTimeline.fromTo(mistRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, ease: 'power1.out' },
        0.12
      );

      // === NARRATIVE STANZA: Visible and readable from 0.14 to 0.24 ===
      masterTimeline.fromTo(stanzaRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.14
      );
      masterTimeline.to(stanzaRef.current, {
        opacity: 0, y: -18, duration: 0.03, ease: 'power2.in'
      }, 0.24);

      // === EXIT: Scene exits cleanly at 0.26–0.32 overlapping Scene3 entry at 0.26 ===
      masterTimeline.to(sceneRef.current, {
        opacity: 0, pointerEvents: 'none', duration: 0.06, ease: 'power1.inOut'
      }, 0.26);

    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      id="scene-forest"
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      style={{
        /* Solid base prevents any transparent PNG showing as checkerboard */
        background: '#03100a',
        /* Isolate as stacking context to prevent bleed from parent */
        isolation: 'isolate',
      }}
      aria-label="Entering the Wayanad Forest"
    >
      {/* === SOLID OPAQUE BASE: Prevents any checkerboard bleed from PNGs === */}
      <div className="absolute inset-0" style={{ background: '#03100a' }} />

      {/* === BASE: Forest aerial hero image — fills entire viewport === */}
      <div
        ref={bgRef}
        className="absolute inset-0 overflow-hidden"
        style={{ background: '#03100a' }}
      >
        <div
          ref={bgScaleRef}
          className="absolute inset-0 will-change-transform origin-center"
          style={{ opacity: 1, background: '#03100a' }}
        >
          <CinematicImage 
            asset={Assets.forestMistBg} 
            className="absolute inset-0 w-full h-full"
            style={{ objectPosition: 'center center' }}
          />
        </div>
      </div>

      {/* === ATMOSPHERE: Rich dark vignette for cinematic depth === */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(2,10,5,0.45) 70%, rgba(2,10,5,0.85) 100%)',
            'linear-gradient(to bottom, rgba(2,10,5,0.55) 0%, transparent 30%, transparent 65%, rgba(2,10,5,0.7) 100%)'
          ].join(', '),
          opacity: 0
        }}
      />

      {/* === LAYER: Organic top foliage shadow framing === */}
      <div
        ref={canopyRef}
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none will-change-transform"
        style={{
          background: 'linear-gradient(to bottom, rgba(2,10,5,0.78) 0%, rgba(2,10,5,0.3) 50%, transparent 100%)',
          opacity: 0,
        }}
      />

      {/* === LAYER: Side framing depth === */}
      <div
        ref={midVegRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2,10,5,0.7) 100%)',
          opacity: 0,
        }}
      />

      {/* === VOLUMETRIC LIGHT RAY 1: Golden sunrise shafts from top-right === */}
      <div
        ref={lightRay1Ref}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          background: 'linear-gradient(145deg, rgba(255,210,100,0.22) 0%, rgba(255,185,60,0.14) 25%, transparent 55%)',
          mixBlendMode: 'screen',
          opacity: 0
        }}
      />

      {/* === VOLUMETRIC LIGHT RAY 2: Diffused light across canopy === */}
      <div
        ref={lightRay2Ref}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(ellipse 110% 70% at 65% 10%, rgba(255,200,80,0.18) 0%, rgba(212,160,60,0.08) 45%, transparent 75%)',
          mixBlendMode: 'screen',
          opacity: 0
        }}
      />

      {/* === ATMOSPHERE: Morning mist drifting through canopy === */}
      <div
        ref={mistRef}
        className="absolute inset-x-0 pointer-events-none will-change-opacity"
        style={{
          top: '25%',
          height: '50%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(180,215,190,0.12) 30%, rgba(160,210,180,0.18) 60%, transparent 100%)',
          opacity: 0
        }}
      />

      {/* === NARRATIVE STANZA: Cinematic text card === */}
      <div
        ref={stanzaRef}
        className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none"
        style={{
          opacity: 0,
          paddingBottom: 'clamp(2.5rem, 7vh, 4.5rem)',
        }}
      >
        <div
          className="cinematic-card text-center px-8"
          style={{
            background: 'rgba(2,10,5,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
          }}
        >
          <p
            className="font-sans text-gold/90 font-medium tracking-[0.34em] uppercase mb-4"
            style={{ fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}
          >
            Western Ghats, Kerala · 800m elevation
          </p>
          <h2
            className="font-serif text-cream font-semibold"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)',
              lineHeight: 1.06,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            Ancient forests.<br />
            <span className="italic font-normal" style={{ color: '#E8B44D', fontSize: '0.88em' }}>Living spices.</span>
          </h2>
          <p
            className="font-sans text-cream/90 mt-5 leading-relaxed tracking-wide max-w-xl mx-auto font-normal"
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
              textShadow: '0 2px 14px rgba(0,0,0,0.9)',
              lineHeight: 1.65,
            }}
          >
            Where the monsoon meets the mountains, centuries-old pepper vines
            weave through the untouched rainforest canopy of Wayanad.
          </p>
        </div>
      </div>
    </section>
  );
}
