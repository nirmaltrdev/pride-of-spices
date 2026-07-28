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
      // Initialize hidden — GSAP will reveal at the correct scroll position
      gsap.set(sceneRef.current, { opacity: 0 });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.11);
        masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.03 }, 0.28);
        return;
      }

      // === ENTRY: Scene crossfades in at 11% scroll (overlaps Scene1 exit) ===
      masterTimeline.fromTo(sceneRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.05, ease: 'power2.inOut' },
        0.11
      );

      // === BACKGROUND: Cinematic dolly-push into forest ===
      // NOTE: bgScaleRef starts at scale 1.12 but opacity 1 to prevent checkerboard bleed
      masterTimeline.fromTo(bgScaleRef.current,
        { scale: 1.14, filter: 'blur(8px)', opacity: 1 },
        { scale: 1.0, filter: 'blur(0px)', opacity: 1, duration: 0.18, ease: 'power2.out', force3D: true },
        0.11
      );
      // Slow continuous push through the forest — parallax speed 1 (slowest)
      masterTimeline.to(bgScaleRef.current, {
        scale: 1.1, y: '-5%', duration: 0.14, ease: 'none', force3D: true
      }, 0.15);

      // === CANOPY: Drops in from above — frames the top of screen ===
      masterTimeline.fromTo(canopyRef.current,
        { y: '-35%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.1, ease: 'power3.out', force3D: true },
        0.12
      );
      // Canopy parallax — moves faster than bg (parallax speed 2)
      masterTimeline.to(canopyRef.current, {
        y: '-12%', duration: 0.14, ease: 'none', force3D: true
      }, 0.15);

      // === MID VEGETATION: Frames left/right — creates depth tunnel ===
      masterTimeline.fromTo(midVegRef.current,
        { scale: 1.28, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 0.1, ease: 'power2.out', force3D: true },
        0.12
      );
      // Mid-veg parallax — moves fastest (parallax speed 3)
      masterTimeline.to(midVegRef.current, {
        scale: 1.06, y: '-3%', duration: 0.14, ease: 'none', force3D: true
      }, 0.15);

      // === VIGNETTE: Cinema depth ===
      masterTimeline.fromTo(vignetteRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, ease: 'power1.out' },
        0.12
      );

      // === VOLUMETRIC LIGHT RAYS ===
      masterTimeline.fromTo(lightRay1Ref.current,
        { opacity: 0, x: '-8%' },
        { opacity: 1, x: '0%', duration: 0.1, ease: 'power2.out' },
        0.13
      );
      masterTimeline.fromTo(lightRay2Ref.current,
        { opacity: 0, x: '8%' },
        { opacity: 1, x: '0%', duration: 0.1, ease: 'power2.out' },
        0.14
      );

      // === ATMOSPHERIC MIST ===
      masterTimeline.fromTo(mistRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, ease: 'power1.out' },
        0.13
      );

      // === NARRATIVE STANZA ===
      masterTimeline.fromTo(stanzaRef.current,
        { opacity: 0, y: 30, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.06, ease: 'power2.out' },
        0.20
      );
      masterTimeline.to(stanzaRef.current, {
        opacity: 0, y: -20, filter: 'blur(2px)', duration: 0.04, ease: 'power2.in'
      }, 0.25);

      // === EXIT: Scene exits at 27% (overlaps Scene3 entry) ===
      masterTimeline.to(sceneRef.current, {
        opacity: 0, duration: 0.04, ease: 'power1.inOut'
      }, 0.27);

    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
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

      {/* === LAYER: Canopy silhouette — frames the top of the scene.
           translateZ(-60px) adds Z-depth using parent perspective:1200px,
           making it read as further away than the mid-ground vegetation.
           This converts the flat 2D slide into a 3D camera push-through. */}
      <div
        ref={canopyRef}
        className="absolute inset-x-0 top-0 will-change-transform origin-top"
        style={{
          height: '75%',
          opacity: 0,
          transform: 'translateZ(-60px)',
          /* contrast(1.1) added for richer, more cinematic silhouette */
          filter: 'brightness(0.55) contrast(1.1) hue-rotate(-10deg)',
        }}
      >
        <CinematicImage 
          asset={Assets.forestCanopy} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center top', objectFit: 'cover' }}
        />
      </div>

      {/* === LAYER: Mid vegetation — frames left & right edges.
           translateZ(-30px) gives Z-depth less than canopy (-60px),
           so it sits between background (0px) and canopy (-60px),
           creating a genuine three-layer parallax depth stack. */}
      <div
        ref={midVegRef}
        className="absolute inset-0 will-change-transform origin-center"
        style={{
          opacity: 0,
          transform: 'translateZ(-30px)',
          filter: 'brightness(0.45) contrast(1.08) hue-rotate(-15deg)',
        }}
      >
        <CinematicImage 
          asset={Assets.midGroundVegetation} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center bottom', objectFit: 'cover' }}
        />
      </div>

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
          paddingBottom: 'clamp(3rem, 8vh, 5rem)',
        }}
      >
        <div
          className="cinematic-card text-center px-8"
          style={{
            background: 'linear-gradient(to top, rgba(2,10,5,0.88) 0%, rgba(2,10,5,0.65) 60%, transparent 100%)',
            padding: 'clamp(1.75rem, 4.5vw, 3rem) clamp(1.5rem, 4vw, 4rem)',
            borderRadius: '0.5rem'
          }}
        >
          <p
            className="font-sans text-cream/50 tracking-[0.38em] uppercase mb-5"
            style={{ fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)' }}
          >
            Western Ghats, Kerala · 800m elevation
          </p>
          <h2
            className="font-serif text-cream"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 4px 40px rgba(0,0,0,0.85), 0 1px 8px rgba(0,0,0,0.7)',
            }}
          >
            Ancient forests.<br />
            <span className="italic" style={{ color: '#D4B852', fontSize: '0.86em' }}>Living spices.</span>
          </h2>
          <p
            className="font-sans text-cream/60 mt-6 leading-relaxed tracking-wide max-w-xl mx-auto"
            style={{
              fontSize: 'clamp(0.82rem, 1.6vw, 1rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.7)'
            }}
          >
            Where the monsoon meets the mountains, centuries-old pepper vines
            weave through the untouched forests of Wayanad.
          </p>
        </div>
      </div>
    </section>
  );
}
