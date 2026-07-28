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
      // Initialize hidden — GSAP will reveal at the correct scroll position
      gsap.set(sceneRef.current, { opacity: 0 });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.52);
        masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.03 }, 0.69);
        return;
      }

      // === ENTRY at 52% scroll (overlaps Scene3 exit at 0.54) ===
      masterTimeline.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'power2.inOut' }, 0.52);

      // Harvest background — black pepper spread
      masterTimeline.fromTo(harvestBgRef.current,
        { scale: 1.14, filter: 'blur(10px)', opacity: 0 },
        { scale: 1.0, filter: 'blur(0px)', opacity: 1, duration: 0.07, ease: 'power2.out' },
        0.52
      );
      masterTimeline.to(harvestBgRef.current, { scale: 1.07, duration: 0.16, ease: 'none' }, 0.56);

      // Warm tonal overlay — lighter max opacity for atmosphere without excess darkness
      masterTimeline.fromTo(warmOverlayRef.current,
        { opacity: 0 },
        { opacity: 0.35, duration: 0.07, ease: 'power1.in' },
        0.54
      );

      // Hand shadow — artisan enters from top right
      masterTimeline.fromTo(handShadowRef.current,
        { x: '130%', y: '-70%', opacity: 0 },
        { x: '20%', y: '-20%', opacity: 0.65, duration: 0.07, ease: 'power2.out' },
        0.53
      );

      // Processing layer crossfades
      masterTimeline.fromTo(processingRef.current,
        { opacity: 0, scale: 1.06, filter: 'blur(10px)' },
        { opacity: 0.85, scale: 1.0, filter: 'blur(0px)', duration: 0.05, ease: 'power2.out' },
        0.60
      );
      masterTimeline.to(handShadowRef.current, { opacity: 0, x: '-15%', duration: 0.04, ease: 'power2.in' }, 0.60);

      // === SUN RAYS: 4 sweeps simulating days of drying ===
      const sweepPositions = [0.60, 0.62, 0.64, 0.66];
      sweepPositions.forEach((pos, i) => {
        masterTimeline.fromTo(sunRayRef.current,
          { x: '-140%', opacity: 0 },
          { x: '140%', opacity: 0.45 + i * 0.02, duration: 0.025, ease: 'power1.inOut' },
          pos
        );
      });

      // === NARRATIVE TEXT 1: Harvest ===
      masterTimeline.fromTo(textGroupRef.current,
        { opacity: 0, y: 25, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' },
        0.60
      );

      // === NARRATIVE TEXT 2: Curing ===
      masterTimeline.to(textGroupRef.current, { opacity: 0, duration: 0.03 }, 0.65);
      masterTimeline.fromTo(curingTextRef.current,
        { opacity: 0, y: 25, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.04, ease: 'power2.out' },
        0.66
      );

      // === SCENE EXIT: Fades out at 69% (overlaps Scene4.5 entry at 0.68) ===
      masterTimeline.to(curingTextRef.current, { opacity: 0, duration: 0.03 }, 0.68);
      masterTimeline.to(warmOverlayRef.current, { opacity: 0, duration: 0.03 }, 0.68);
      masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.69);
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[6]"
      style={{ transformStyle: 'preserve-3d' }}
      aria-label="The Traditional Harvest Process"
    >
      {/* === BASE: Black pepper harvest spread === */}
      <div
        ref={harvestBgRef}
        className="absolute inset-0 origin-center will-change-transform opacity-0"
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
        className="absolute inset-0 will-change-transform opacity-0"
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
            background: 'rgba(8,6,4,0.68)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 'clamp(1.5rem, 4vw, 2.8rem) clamp(1.5rem, 4vw, 3.5rem)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55)'
          }}
        >
          <p className="font-sans tracking-[0.32em] uppercase mb-5" style={{ color: 'rgba(212,147,42,0.9)', fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)' }}>
            Generations of craft
          </p>
          <h2
            className="font-serif text-cream"
            style={{
              fontSize: 'clamp(1.7rem, 4.5vw, 3.4rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}
          >
            Harvested by hand.<br />
            <span className="italic" style={{ color: 'rgba(240,230,195,0.9)' }}>Dried under the sun.</span>
          </h2>
          <p className="font-sans text-cream/62 mt-5 leading-relaxed max-w-sm mx-auto" style={{ fontSize: 'clamp(0.78rem, 1.5vw, 0.95rem)' }}>
            Only the heaviest, fully mature berries are selected. Each cluster
            inspected by hand before the drying begins.
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
            background: 'rgba(8,6,4,0.68)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 'clamp(1.5rem, 4vw, 2.8rem) clamp(1.5rem, 4vw, 3.5rem)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55)'
          }}
        >
          <p className="font-sans tracking-[0.32em] uppercase mb-5" style={{ color: 'rgba(212,147,42,0.9)', fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)' }}>
            The Curing Process
          </p>
          <h2
            className="font-serif text-cream"
            style={{
              fontSize: 'clamp(1.7rem, 4.5vw, 3.4rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}
          >
            7 days under<br />
            <span className="italic" style={{ color: 'rgba(240,230,195,0.9)' }}>the Kerala sun.</span>
          </h2>
          <p className="font-sans text-cream/62 mt-5 leading-relaxed max-w-sm mx-auto" style={{ fontSize: 'clamp(0.78rem, 1.5vw, 0.95rem)' }}>
            Spread across traditional bamboo mats, natural enzymes slowly cure the skin
            into a deep, rich black — locking in the intense volatile oils.
          </p>
        </div>
      </div>
    </section>
  );
}
