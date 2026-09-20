import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/**
 * SCENE 4.5: WILD FOREST HONEY — Version 2 (Fixed Timeline)
 *
 * Master timeline positions (scroll % range: 70% → 100%):
 *   0.70 → Scene fades in, world turns amber
 *   0.73 → Golden bloom, honeycomb pattern
 *   0.75 → Narrative text 1 (The Golden Wilds)
 *   0.79 → Narrative text 2 (Forest's Flavour)
 *   0.94 → Scene exits (PUSHED from 0.88, snap removed — no longer needed early)
 *
 * FIX: Exit pushed from 0.88 → 0.94. With GSAP snap removed in SceneManager,
 * there is no forced pause at 0.88. Scene can stay rich until the end of 750vh.
 * This eliminates the blank dark zone between Wild Honey and Collection.
 */
export function Scene4_5_Honey() {
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const sceneRef = useRef<HTMLElement>(null);
  const honeyBgRef = useRef<HTMLDivElement>(null);
  const honeycombRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const warmOverlayRef = useRef<HTMLDivElement>(null);
  const textGroup1Ref = useRef<HTMLDivElement>(null);
  const textGroup2Ref = useRef<HTMLDivElement>(null);
  const honeyDripsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // Initialize hidden — GSAP will reveal at the correct scroll position
      // Initialize at opacity 0 — timeline controls reveal
      gsap.set(sceneRef.current, { opacity: 0, pointerEvents: 'none' });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.03 }, 0.68);
        // No exit tween — sceneRef stays visible through TL=1.0 for natural unpin handoff
        return;
      }

      // === ENTRY at 68% scroll (overlaps Scene4 exit 0.68–0.74) ===
      masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.08, ease: 'power2.inOut' }, 0.68);

      // Honey background: parallax + saturation warm-up (GPU transform only)
      masterTimeline.fromTo(honeyBgRef.current,
        { scale: 1.08, opacity: 0.8, y: '5%' },
        { scale: 1.0, opacity: 1, y: '0%', duration: 0.06, ease: 'power2.out' },
        0.68
      );
      masterTimeline.to(honeyBgRef.current, { scale: 1.05, y: '-3%', duration: 0.26, ease: 'none' }, 0.72);

      // Warm golden overlay blooms
      masterTimeline.fromTo(warmOverlayRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 0.5, scale: 1.1, duration: 0.08, ease: 'power2.out' },
        0.70
      );

      // Honeycomb pattern drifts
      masterTimeline.fromTo(honeycombRef.current,
        { opacity: 0, y: '5%' },
        { opacity: 0.25, y: '-4%', duration: 0.26, ease: 'none' },
        0.70
      );

      // Honey drips
      masterTimeline.fromTo(honeyDripsRef.current,
        { opacity: 0 },
        { opacity: 0.6, duration: 0.06, ease: 'power2.out' },
        0.71
      );

      // Central glow
      masterTimeline.fromTo(glowRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 0.65, scale: 1.05, duration: 0.07, ease: 'power2.out' },
        0.71
      );

      // === NARRATIVE TEXT 1: The Golden Wilds (active 0.70 to 0.81) ===
      masterTimeline.fromTo(textGroup1Ref.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.70
      );

      // Transition to text 2: Text 1 is completely gone at 0.81 BEFORE Text 2 enters at 0.82
      masterTimeline.to(textGroup1Ref.current, { opacity: 0, y: -15, duration: 0.03, ease: 'power2.in' }, 0.80);

      // === NARRATIVE TEXT 2: The Taste (active 0.82 to 0.93) ===
      masterTimeline.fromTo(textGroup2Ref.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.82
      );

      // === SCENE EXIT: Text and ambient overlays fade out at 0.93–0.97 ===
      // The honey BACKGROUND (honeyBgRef) and scene CONTAINER (sceneRef) deliberately
      // stay at opacity:1 through TL=1.0. This ensures Wild Honey is visible right up
      // until the sticky container naturally unpins and Collection scrolls into view.
      masterTimeline.to(textGroup2Ref.current, { opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.93);
      masterTimeline.to([warmOverlayRef.current, honeycombRef.current, honeyDripsRef.current, glowRef.current], {
        opacity: 0, duration: 0.06, stagger: 0.005
      }, 0.94);
      // honeyBgRef and sceneRef are NOT faded — they remain visible for the handoff.

    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      id="scene-honey"
      className="absolute inset-0 w-full h-full pointer-events-none z-[7]"
      style={{ transformStyle: 'preserve-3d' }}
      aria-label="The Wild Forest Honey of the Nilgiri Biosphere"
    >
      {/* === BASE: Honey atmospheric background === */}
      <div
        ref={honeyBgRef}
        className="absolute inset-0 origin-center will-change-transform"
      >
        <CinematicImage 
          asset={Assets.honeyBg} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 42%', objectFit: 'cover' }}
        />
      </div>

      {/* === Dark overlay for legibility — strengthened for BUG 5 fix === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(10,6,2,0.62)' }}
      />

      {/* === HONEYCOMB PATTERN === */}
      <div
        ref={honeycombRef}
        className="absolute inset-0 will-change-transform opacity-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='138'%3E%3Cpath d='M40 0L80 23.1v46.2L40 92.4 0 69.3V23.1Z' fill='none' stroke='%23C9A84C' stroke-width='0.7' opacity='0.55'/%3E%3Cpath d='M40 92.4L80 115.5V138H0v-22.5Z' fill='none' stroke='%23C9A84C' stroke-width='0.7' opacity='0.55'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 138px',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* === GOLDEN BLOOM === */}
      <div
        ref={warmOverlayRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 pointer-events-none will-change-transform"
        style={{
          width: '120vmin',
          height: '120vmin',
          background: 'radial-gradient(circle, rgba(212,147,42,0.48) 0%, rgba(201,168,76,0.22) 40%, transparent 68%)',
          mixBlendMode: 'color-dodge',
          filter: 'blur(70px)'
        }}
      />

      {/* === SECONDARY GLOW === */}
      <div
        ref={glowRef}
        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 pointer-events-none will-change-transform"
        style={{
          width: '60vmin',
          height: '60vmin',
          background: 'radial-gradient(circle, rgba(255,200,80,0.35) 0%, transparent 65%)',
          filter: 'blur(40px)'
        }}
      />

      {/* === HONEY DRIPS === */}
      <div
        ref={honeyDripsRef}
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(180,120,20,0.35) 0%, rgba(200,140,30,0.12) 50%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      />

      {/* === NARRATIVE STANZA 1: The Golden Wilds === */}
      <div
        ref={textGroup1Ref}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(8,5,2,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 5vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: '#E8B44D', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            The Golden Wilds
          </p>
          <h2
            className="font-serif text-cream font-semibold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.8rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              textWrap: 'balance',
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            Sourced from the<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>untamed cliffs.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed max-w-lg mx-auto font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Collected by the Kattunayakan tribes deep within the Nilgiri Biosphere.
            No smoke. No disruption. Just the pure, unpasteurized nectar
            of the wild Rock Bee.
          </p>
        </div>
      </div>

      {/* === NARRATIVE STANZA 2: The Forest's Flavour === */}
      <div
        ref={textGroup2Ref}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(8,5,2,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 5vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: '#E8B44D', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            Raw &amp; Unfiltered
          </p>
          <h2
            className="font-serif text-cream font-semibold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.8rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              textWrap: 'balance',
              textShadow: '0 4px 30px rgba(0,0,0,0.95)',
            }}
          >
            Every drop tells<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>the forest's story.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed max-w-lg mx-auto font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Each batch carries the unique floral signature of the seasonal bloom.
            Dark and resinous from the jackfruit season. Raw, alive, and utterly
            unlike any processed honey.
          </p>
        </div>
      </div>
    </section>
  );
}
