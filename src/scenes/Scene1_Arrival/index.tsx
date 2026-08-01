import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';
import { scrollToPercent } from '../../core/lenisInstance';

/**
 * SCENE 1: ARRIVAL — Version 3 (Cinematic Production Polish)
 *
 * Timeline positions (master timeline = 1.0 second = 100% scroll):
 *   0.00 → Scene entry / hero visible
 *   0.11 → Exit begins (overlaps with Scene 2's entry at 0.11)
 *   0.14 → Scene fully faded (Scene 2 has fully taken over)
 *
 * Text Entry Animation (load-time):
 *   - Heading: fade + 20px upward + blur reduction (filter: blur(6px) → 0)
 *   - Subtitle: staggered delay after heading
 *   - Scroll cue: fades last
 *
 * GPU Acceleration: Only transform + opacity used throughout.
 * will-change: set on actively animated elements, cleaned up after completion.
 */
export function Scene1_Arrival() {
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const sceneRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const vignRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lightRayRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  // On-load entry animation (not scroll-tied) — text reveals with blur + rise
  // CRITICAL: Wrapping in document.fonts.ready guarantees web fonts are loaded
  // before any text-bearing elements become visible. Prevents invisible-text flash.
  useLayoutEffect(() => {
    let isActive = true;
    let ctx: gsap.Context | null = null;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    const showAllFallback = () => {
      if (titleWrapRef.current) gsap.set(titleWrapRef.current, { opacity: 1 });
      if (eyebrowRef.current) gsap.set(eyebrowRef.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (headingRef.current) gsap.set(headingRef.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 1, y: 0 });
      if (scrollCueRef.current) gsap.set(scrollCueRef.current, { opacity: 1, y: 0 });
      if (bgRef.current) gsap.set(bgRef.current, { scale: 1.0, filter: 'blur(0px)' });
      if (mistRef.current) gsap.set(mistRef.current, { opacity: 1 });
      if (lightRayRef.current) gsap.set(lightRayRef.current, { opacity: 0.4, x: '0%' });
    };

    if (prefersReducedMotion) {
      showAllFallback();
      return;
    }

    const startEntryAnimation = () => {
      if (!isActive) return;

      // Fail-safe: content always becomes visible even if GSAP is interrupted
      fallbackTimeout = setTimeout(() => {
        if (isActive) showAllFallback();
      }, 4500);

      ctx = gsap.context(() => {
        gsap.set([bgRef.current, titleWrapRef.current], { willChange: 'transform, opacity' });

        const entry = gsap.timeline({
          delay: 0.3,
          onComplete: () => {
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
            // Release GPU compositing layers after animation completes
            gsap.set([bgRef.current, titleWrapRef.current], { willChange: 'auto' });
          },
        });

        // Background camera push-in: blurry → focused → clear
        entry.fromTo(
          bgRef.current,
          { scale: 1.12, filter: 'blur(8px)' },
          { scale: 1.0, filter: 'blur(0px)', duration: 2.8, ease: 'power3.out' }
        );

        // Morning mist breathes in
        entry.fromTo(
          mistRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.8, ease: 'power1.out' },
          0.3
        );

        // Light rays sweep in from left
        entry.fromTo(
          lightRayRef.current,
          { opacity: 0, x: '-15%' },
          { opacity: 0.4, x: '0%', duration: 2.8, ease: 'power2.out' },
          0.6
        );

        // Eyebrow label fades in with slight upward drift
        entry.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: 12, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out' },
          0.7
        );

        // Main heading: blur reduction + upward rise — cinematic word reveal
        entry.fromTo(
          headingRef.current,
          { opacity: 0, y: 20, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, ease: 'power2.out' },
          0.9
        );

        // Subtitle fades in after heading settles
        entry.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' },
          1.4
        );

        // Scroll cue appears last
        entry.fromTo(
          scrollCueRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' },
          1.8
        );

        // Scroll cue: proper fromTo loop so it resets between cycles (not just scaleY:0 forever)
        gsap.fromTo(
          '[data-scroll-line]',
          { scaleY: 1, transformOrigin: 'top', opacity: 1 },
          {
            scaleY: 0,
            opacity: 0.3,
            transformOrigin: 'top',
            duration: 1.1,
            ease: 'power1.inOut',
            repeat: -1,
            repeatDelay: 0.4,
            delay: 2.8,
          }
        );
      }, sceneRef);
    };

    // Gate animation start on font readiness — eliminates invisible-text flash
    if (document.fonts && document.fonts.status === 'loaded') {
      startEntryAnimation();
    } else if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          if (isActive) startEntryAnimation();
        })
        .catch(() => {
          if (isActive) startEntryAnimation();
        });
    } else {
      startEntryAnimation();
    }

    return () => {
      isActive = false;
      if (ctx) ctx.revert();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [prefersReducedMotion]);

  // Scroll-tied EXIT animation — overlaps with Scene 2 entry at 0.11
  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // Scene container opacity tied to 0-13% range
        masterTimeline.fromTo(sceneRef.current,
          { opacity: 1 },
          { opacity: 0, duration: 0.04, ease: 'power1.inOut' },
          0.11
        );

        // Title wrapper rises and fades between 0 and 12% scroll
        masterTimeline.fromTo(titleWrapRef.current,
          { opacity: 1, y: 0, filter: 'blur(0px)' },
          { y: -80, opacity: 0, filter: 'blur(4px)', duration: 0.12, ease: 'power2.in' },
          0
        );

        // Background dollies forward and blurs during 0-13% of scroll
        masterTimeline.fromTo(bgRef.current,
          { scale: 1.0, filter: 'blur(0px)' },
          { scale: 1.25, filter: 'blur(6px)', duration: 0.13, ease: 'power2.in' },
          0
        );

        // Mid gradient & mist clear smoothly from 0-11%
        masterTimeline.fromTo([midRef.current, mistRef.current, vignRef.current],
          { opacity: 1 },
          { opacity: 0, duration: 0.11, ease: 'power1.inOut' },
          0
        );

        // Light rays fade from 0-10%
        masterTimeline.fromTo(lightRayRef.current,
          { opacity: 0.4 },
          { opacity: 0, duration: 0.10, ease: 'power1.inOut' },
          0
        );

        // Scroll cue fades immediately (0-0.04)
        masterTimeline.fromTo(scrollCueRef.current,
          { opacity: 1 },
          { opacity: 0, duration: 0.04, ease: 'power1.in' },
          0
        );
      } else {
        masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.15 }, 0);
      }
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <div
      ref={sceneRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      style={{ transformStyle: 'preserve-3d' }}
      role="img"
      aria-label="Cinematic arrival scene — The Pride of Spices from the Heart of Wayanad"
    >
      {/* === LAYER 1: Deep Background Forest Path === */}
      <div
        ref={bgRef}
        className="absolute inset-0 origin-center will-change-transform"
      >
        <CinematicImage 
          asset={Assets.forestPath} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center center' }}
        />
      </div>

      {/* === LAYER 2: Bottom depth gradient === */}
      <div
        ref={midRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(4,8,4,0.85) 0%, transparent 50%)',
          opacity: 0.7
        }}
      />

      {/* === LAYER 3: Diagonal Sun Rays === */}
      <div
        ref={lightRayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(212,180,100,0.22) 0%, transparent 50%, rgba(212,180,100,0.08) 100%)',
          mixBlendMode: 'overlay',
          opacity: 0
        }}
      />

      {/* === LAYER 4: Morning Mist === */}
      <div
        ref={mistRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 130% 100% at center 40%, rgba(230,225,210,0.35) 0%, rgba(190,205,185,0.15) 50%, rgba(20,30,20,0.0) 100%)',
          opacity: 0
        }}
      />

      {/* === LAYER 5: Strong Dark Vignette — improves text readability === */}
      <div
        ref={vignRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          // Stronger vignette for better text contrast, preserves visual depth
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(3,7,3,0.55) 65%, rgba(3,7,3,0.90) 100%)'
        }}
      />

      {/* === LAYER 6: Adaptive text-area gradient — ensures heading legibility === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(4,8,4,0.4) 0%, transparent 30%, transparent 60%, rgba(4,8,4,0.5) 100%)'
        }}
      />

      {/* === CINEMATIC TITLE CARD ===
           The wrapper is visible (opacity:1); individual children start at opacity:0
           and are animated in sequence by the GSAP entry timeline above. === */}
      <div
        ref={titleWrapRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: 1,
          // Shift content up slightly on notch devices so it doesn't sit behind Dynamic Island
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="text-center px-6 md:px-4">
          {/* Eyebrow */}
          <p
            ref={eyebrowRef}
            className="font-sans text-cream/60 uppercase select-none"
            style={{
              fontSize: 'clamp(0.68rem, 1.4vw, 0.78rem)',
              letterSpacing: '0.38em',
              textShadow: '0 1px 12px rgba(0,0,0,0.8)',
              opacity: 0,
            }}
          >
            From the Heart of Wayanad
          </p>

          {/* Main Title — refined text shadow for adaptive contrast */}
          <h1
            ref={headingRef}
            className="font-serif text-cream select-none"
            style={{
              fontSize: 'clamp(2.6rem, 11vw, 10rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.01em',
              textWrap: 'balance',
              marginTop: 'clamp(0.75rem, 2vh, 1.25rem)',
              // Multi-layer text shadow: strong offset shadow + subtle mid glow
              textShadow: '0 4px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.9), 0 16px 80px rgba(0,0,0,0.5)',
              opacity: 0,
            }}
          >
            The Pride<br />
            <span
              className="italic"
              style={{ color: '#D4932A', fontSize: '0.75em' }}
            >
              of Spices
            </span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="font-sans text-cream/65 select-none"
            style={{
              fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)',
              letterSpacing: '0.18em',
              marginTop: 'clamp(0.75rem, 1.5vh, 1rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)',
              textWrap: 'balance',
              opacity: 0,
            }}
          >
            Heritage Spices &amp; Forest Honey · Wayanad, Kerala
          </p>

          {/* Animated Scroll Cue */}
          <div 
            ref={scrollCueRef} 
            className="flex flex-col items-center gap-3 cursor-pointer pointer-events-auto" 
            style={{
              opacity: 0,
              marginTop: 'clamp(1.75rem, 4vh, 2.75rem)',
            }}
            onClick={() => scrollToPercent(0.15)}
            role="button"
            aria-label="Click to enter the experience"
          >
            <span
              className="font-sans text-cream/35 uppercase transition-colors hover:text-cream/70"
              style={{
                fontSize: 'clamp(0.5rem, 0.9vw, 0.65rem)',
                letterSpacing: '0.35em',
                textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              }}
            >
              Scroll or Click to Enter
            </span>
            <div className="relative overflow-hidden" style={{ width: '1px', height: '48px' }}>
              <div
                data-scroll-line
                className="absolute inset-0 will-change-transform"
                style={{
                  background: 'linear-gradient(to bottom, rgba(212,147,42,0.8), rgba(240,230,200,0.15))',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
