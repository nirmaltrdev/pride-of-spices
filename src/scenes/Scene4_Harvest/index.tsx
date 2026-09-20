import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/**
 * SCENE 4: THE HARVEST — Version 2 (Fixed Timeline)
 *
 * Master timeline positions (scroll % range: 55% → 70%):
 *   0.55 → Scene entry, black pepper
 *   0.58 → Hand shadow and processing layer
 *   0.60 → Harvest narrative text
 *   0.63 → Sun sweeps (time-lapse drying)
 *   0.66 → Craft text
 *   0.70 → Scene exit
 */
export function Scene4_Harvest() {
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const sceneRef = useRef<HTMLElement>(null);
  const harvestBgRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<HTMLDivElement>(null);
  const sunRayRef = useRef<HTMLDivElement>(null);
  const handShadowRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const curingTextRef = useRef<HTMLDivElement>(null);
  const warmOverlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // Initialize at opacity 0 — timeline controls reveal
      gsap.set(sceneRef.current, { opacity: 0, pointerEvents: 'none' });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.03 }, 0.52);
        masterTimeline.to(sceneRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.03 }, 0.69);
        return;
      }

      // === ENTRY at 50% scroll (overlaps Scene3 exit 0.50–0.56) ===
      masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.08, ease: 'power2.inOut' }, 0.50);

      // Harvest background — black pepper spread (GPU transform only)
      masterTimeline.fromTo(harvestBgRef.current,
        { scale: 1.08, opacity: 0.8 },
        { scale: 1.0, opacity: 1, duration: 0.06, ease: 'power2.out' },
        0.50
      );
      masterTimeline.to(harvestBgRef.current, { scale: 1.05, duration: 0.22, ease: 'none' }, 0.54);

      // Warm tonal overlay
      masterTimeline.fromTo(warmOverlayRef.current,
        { opacity: 0 },
        { opacity: 0.35, duration: 0.06, ease: 'power1.in' },
        0.52
      );

      // Hand shadow — artisan enters from top right
      masterTimeline.fromTo(handShadowRef.current,
        { x: '110%', y: '-50%', opacity: 0 },
        { x: '20%', y: '-20%', opacity: 0.65, duration: 0.06, ease: 'power2.out' },
        0.52
      );

      // Processing layer crossfades smoothly
      masterTimeline.fromTo(processingRef.current,
        { opacity: 0, scale: 1.04 },
        { opacity: 0.85, scale: 1.0, duration: 0.05, ease: 'power2.out' },
        0.58
      );
      masterTimeline.to(handShadowRef.current, { opacity: 0, x: '-15%', duration: 0.03, ease: 'power2.in' }, 0.58);

      // === SUN RAYS: sweeps simulating days of drying ===
      const sweepPositions = [0.55, 0.57, 0.59, 0.61];
      sweepPositions.forEach((pos, i) => {
        masterTimeline.fromTo(sunRayRef.current,
          { x: '-140%', opacity: 0 },
          { x: '140%', opacity: 0.4 + i * 0.03, duration: 0.025, ease: 'power1.inOut' },
          pos
        );
      });

      // === NARRATIVE TEXT 1: Harvest (active 0.52 to 0.63) ===
      masterTimeline.fromTo(textGroupRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.52
      );

      // Text 1 fades out completely BEFORE Text 2 starts
      masterTimeline.to(textGroupRef.current, { opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.62);

      // === NARRATIVE TEXT 2: Curing (active 0.62 to 0.72) ===
      masterTimeline.fromTo(curingTextRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.62
      );

      // === SCENE EXIT: ends text at 0.72, scene exits 0.70–0.76 overlapping Scene4.5 ===
      masterTimeline.to(curingTextRef.current, { opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.72);
      masterTimeline.to(warmOverlayRef.current, { opacity: 0, duration: 0.04 }, 0.72);
      masterTimeline.to(sceneRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.06, ease: 'power1.inOut' }, 0.70);
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      id="scene-harvest"
      className="absolute inset-0 w-full h-full pointer-events-none z-[6]"
      aria-label="The Traditional Harvest Process"
    >
      {/* === BASE: Black pepper harvest spread === */}
      <div
        ref={harvestBgRef}
        className="absolute inset-0 origin-center will-change-transform"
      >
        <CinematicImage 
          asset={Assets.blackPepper} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 52%', objectFit: 'cover' }}
        />
      </div>

      {/* === PROCESSING: Curing & grading === */}
      <div
        ref={processingRef}
        className="absolute inset-0 will-change-transform"
        style={{ mixBlendMode: 'luminosity' }}
      >
        <CinematicImage 
          asset={Assets.processing} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 38%', objectFit: 'cover' }}
        />
      </div>

      {/* === Warm tonal overlay === */}
      <div
        ref={warmOverlayRef}
        className="absolute inset-0 pointer-events-none will-change-opacity opacity-0"
        style={{
          background: 'radial-gradient(ellipse at center 35%, rgba(212,147,42,0.22) 0%, transparent 70%)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* === HAND SHADOW: The artisan === */}
      <div
        ref={handShadowRef}
        className="absolute inset-0 will-change-transform opacity-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 15%, rgba(12,8,4,0.88) 0%, transparent 55%)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* === SUN SWEEP: Time-lapse curing rays === */}
      <div
        ref={sunRayRef}
        className="absolute inset-y-0 left-0 w-[90%] will-change-transform opacity-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,180,80,0.6) 50%, transparent 100%)',
          mixBlendMode: 'color-dodge'
        }}
      />

      {/* === NARRATIVE STANZA 1: Harvest === */}
      <div
        ref={textGroupRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(6,4,2,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: '#E8B44D', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            Generations of craft
          </p>
          <h2
            className="font-serif text-cream font-semibold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.6rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            Harvested by hand.<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>Dried under the sun.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed max-w-lg mx-auto font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Only the heaviest, fully mature pepper berries are selected by hand. Each cluster
            is inspected individually on the vine before traditional drying begins.
          </p>
        </div>
      </div>

      {/* === NARRATIVE STANZA 2: Craft === */}
      <div
        ref={curingTextRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(6,4,2,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: '#E8B44D', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            The Curing Process
          </p>
          <h2
            className="font-serif text-cream font-semibold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.6rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            7 days under<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>the Kerala sun.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed max-w-lg mx-auto font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Spread across natural woven bamboo mats, solar warmth slowly cures the berries
            into rich wrinkled peppercorns — sealing in high-potency piperine oils.
          </p>
        </div>
      </div>
    </section>
  );
}
