import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';
import { scrollToScene } from '../../core/lenisInstance';

/**
 * SCENE 1: ARRIVAL
 */
export function Scene1_Arrival() {
  const { masterTimeline, registerScene, unregisterScene } = useMasterTimeline();
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
  const scrollCueRef = useRef<HTMLButtonElement>(null);

  // 1. Initial Entry Animation (Intro flourish — progressive enhancement, never leaves content blank)
  useLayoutEffect(() => {
    let isActive = true;
    let ctx: gsap.Context | null = null;

    if (prefersReducedMotion) {
      if (mistRef.current) gsap.set(mistRef.current, { opacity: 0.6 });
      if (lightRayRef.current) gsap.set(lightRayRef.current, { opacity: 0.3 });
      return;
    }

    const startEntryAnimation = () => {
      if (!isActive) return;

      ctx = gsap.context(() => {
        const entry = gsap.timeline({ delay: 0.1 });

        // Background camera subtle push-in
        if (bgRef.current) {
          entry.fromTo(
            bgRef.current,
            { scale: 1.05 },
            { scale: 1.0, duration: 1.8, ease: 'power2.out' },
            0
          );
        }

        // Morning mist breathes in
        if (mistRef.current) {
          entry.fromTo(
            mistRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 1.4, ease: 'power1.out' },
            0.2
          );
        }

        // Light rays sweep in from left
        if (lightRayRef.current) {
          entry.fromTo(
            lightRayRef.current,
            { opacity: 0, x: '-15%' },
            { opacity: 0.4, x: '0%', duration: 1.8, ease: 'power2.out' },
            0.3
          );
        }

        // Eyebrow and heading gentle elevation
        if (eyebrowRef.current) {
          entry.from(
            eyebrowRef.current,
            { y: 10, duration: 0.8, ease: 'power2.out' },
            0.3
          );
        }

        if (headingRef.current) {
          entry.from(
            headingRef.current,
            { y: 14, duration: 1.0, ease: 'power2.out' },
            0.4
          );
        }

        if (subtitleRef.current) {
          entry.from(
            subtitleRef.current,
            { y: 10, duration: 0.8, ease: 'power2.out' },
            0.6
          );
        }

        // Pulsing scroll line animation
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
            delay: 1.2,
          }
        );
      }, sceneRef);
    };

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
    };
  }, [prefersReducedMotion]);

  // 2. Master Scroll-Tied EXIT Animation (Master timeline is the sole owner of exit scrub)
  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    if (prefersReducedMotion) {
      masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.12 }, 0);
      registerScene('arrival');
      return () => unregisterScene('arrival');
    }

    const ctx = gsap.context(() => {
      masterTimeline.fromTo(
        sceneRef.current,
        { opacity: 1, pointerEvents: 'auto' },
        { opacity: 0, pointerEvents: 'none', duration: 0.08, ease: 'power1.inOut', immediateRender: false },
        0.10
      );

      masterTimeline.fromTo(
        titleWrapRef.current,
        { opacity: 1, y: 0 },
        { y: -50, opacity: 0, duration: 0.12, ease: 'power2.in', immediateRender: false },
        0
      );

      masterTimeline.fromTo(
        bgRef.current,
        { scale: 1.0 },
        { scale: 1.14, duration: 0.14, ease: 'power2.in', immediateRender: false },
        0
      );

      masterTimeline.fromTo(
        [midRef.current, mistRef.current, vignRef.current],
        { opacity: 1 },
        { opacity: 0, duration: 0.12, ease: 'power1.inOut', immediateRender: false },
        0
      );

      masterTimeline.fromTo(
        lightRayRef.current,
        { opacity: 0.4 },
        { opacity: 0, duration: 0.10, ease: 'power1.inOut', immediateRender: false },
        0
      );

      masterTimeline.fromTo(
        scrollCueRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 0.05, ease: 'power1.in', immediateRender: false },
        0
      );
    }, sceneRef);

    registerScene('arrival');

    return () => {
      ctx.revert();
      unregisterScene('arrival');
    };
  }, [masterTimeline, prefersReducedMotion, registerScene, unregisterScene]);

  return (
    <section
      ref={sceneRef}
      id="scene-arrival"
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-10"
      style={{ opacity: 1, pointerEvents: 'auto' }}
      aria-label="The Pride of Spices — Heritage Spices and Forest Honey from Wayanad"
    >
      {/* Background Forest Path */}
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

      {/* Bottom depth gradient */}
      <div
        ref={midRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(3,7,3,0.92) 0%, transparent 50%)',
          opacity: 0.8
        }}
      />

      {/* Diagonal Sun Rays */}
      <div
        ref={lightRayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(212,180,100,0.22) 0%, transparent 50%, rgba(212,180,100,0.08) 100%)',
          mixBlendMode: 'overlay',
          opacity: 0
        }}
      />

      {/* Morning Mist */}
      <div
        ref={mistRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 130% 100% at center 40%, rgba(230,225,210,0.30) 0%, rgba(190,205,185,0.12) 50%, rgba(20,30,20,0.0) 100%)',
          opacity: 0
        }}
      />

      {/* Dark Vignette */}
      <div
        ref={vignRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(2,6,2,0.60) 65%, rgba(2,6,2,0.95) 100%)'
        }}
      />

      {/* Adaptive text scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(3,8,3,0.55) 0%, transparent 75%)'
        }}
      />

      {/* Cinematic Title Card */}
      <div
        ref={titleWrapRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: 1,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="text-center px-4 w-full max-w-4xl mx-auto">
          {/* Eyebrow */}
          <p
            ref={eyebrowRef}
            className="font-sans text-cream/80 uppercase select-none font-medium"
            style={{
              fontSize: 'clamp(0.72rem, 1.4vw, 0.85rem)',
              letterSpacing: '0.38em',
              textShadow: '0 2px 14px rgba(0,0,0,0.9)',
            }}
          >
            From the Heart of Wayanad
          </p>

          {/* Main Title (Single authoritative H1 on page) */}
          <h1
            ref={headingRef}
            className="font-serif text-cream select-none font-semibold"
            style={{
              fontSize: 'clamp(2.6rem, 10vw, 8.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              textWrap: 'balance',
              marginTop: 'clamp(0.75rem, 2vh, 1.25rem)',
              textShadow: '0 4px 40px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.95)',
            }}
          >
            The Pride<br />
            <span
              className="italic font-normal"
              style={{ color: '#E8B44D', fontSize: '0.78em' }}
            >
              of Spices
            </span>
          </h1>

          {/* Subtitle */}
          <div
            ref={subtitleRef}
            className="font-sans text-cream select-none mt-4 mx-auto max-w-2xl px-2"
          >
            <p
              className="font-medium text-cream/90"
              style={{
                fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)',
                letterSpacing: '0.12em',
                textShadow: '0 2px 16px rgba(0,0,0,0.95)',
                lineHeight: 1.5,
              }}
            >
              Natural Wayanadan Spices at Your Doorstep
            </p>
            <p
              className="font-medium uppercase text-gold mt-1.5"
              style={{
                fontSize: 'clamp(0.72rem, 1.4vw, 0.85rem)',
                letterSpacing: '0.2em',
                textShadow: '0 2px 12px rgba(0,0,0,0.95)',
                wordBreak: 'break-word',
              }}
            >
              Heritage Spices &amp; Forest Honey · Wayanad, Kerala
            </p>
          </div>

          {/* Animated Scroll Cue — Accessible Interactive Button */}
          <button 
            ref={scrollCueRef} 
            type="button"
            className="flex flex-col items-center gap-2.5 cursor-pointer pointer-events-auto mx-auto group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full" 
            style={{
              marginTop: 'clamp(1.75rem, 4vh, 3rem)',
              background: 'transparent',
              border: 'none',
              padding: '6px',
            }}
            onClick={() => scrollToScene('forest')}
            aria-label="Scroll or click to enter the Wayanad spice journey"
          >
            <span
              className="font-sans text-cream/90 uppercase font-semibold transition-all duration-300 group-hover:text-gold group-hover:border-gold/60"
              style={{
                fontSize: 'clamp(0.62rem, 1.1vw, 0.72rem)',
                letterSpacing: '0.3em',
                textShadow: '0 2px 10px rgba(0,0,0,0.95)',
                padding: '6px 16px',
                borderRadius: '9999px',
                background: 'rgba(3,8,3,0.75)',
                border: '1px solid rgba(212,147,42,0.4)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              Scroll or Click to Enter ↓
            </span>
            <div
              className="relative overflow-hidden"
              style={{ width: '2px', height: '44px', background: 'rgba(255,255,255,0.15)' }}
              aria-hidden="true"
            >
              <div
                data-scroll-line
                className="absolute inset-0 will-change-transform"
                style={{
                  background: 'linear-gradient(to bottom, #D4932A, rgba(240,230,200,0.2))',
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
