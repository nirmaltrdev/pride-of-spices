import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/**
 * SCENE 3: THE DISCOVERY — Version 2 (Fixed Timeline)
 *
 * Master timeline positions (scroll % range):
 *   0.29 → Scene fades in, pepper world
 *   0.33 → Green pepper close-up focuses
 *   0.38 → Narrative text 1 appears
 *   0.43 → Monsoon rain begins
 *   0.47 → Pepper ripens to red
 *   0.50 → Narrative text 2 (post-monsoon)
 *   0.54 → Scene exits
 */
export function Scene3_Discovery() {
  const { masterTimeline } = useMasterTimeline();
  const prefersReducedMotion = useReducedMotion();

  const sceneRef = useRef<HTMLElement>(null);
  const bgBaseRef = useRef<HTMLDivElement>(null);
  const pepperCloseRef = useRef<HTMLDivElement>(null);
  const farmerRef = useRef<HTMLDivElement>(null);
  const lightRayRef = useRef<HTMLDivElement>(null);
  const dewdropRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const rainOverlayRef = useRef<HTMLDivElement>(null);
  const ripePepperRef = useRef<HTMLDivElement>(null);
  const lifecycleTextRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // Initialize hidden — GSAP will reveal at the correct scroll position
      gsap.set(sceneRef.current, { opacity: 0 });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.26);
        masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.03 }, 0.54);
        return;
      }

      // === ENTRY at 26% scroll (overlaps Scene2 exit at 0.27) ===
      masterTimeline.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'power2.inOut' }, 0.26);

      // Wide plantation background — starts blurry (focus rack)
      masterTimeline.fromTo(bgBaseRef.current,
        { scale: 1.15, filter: 'blur(14px)', opacity: 0.4 },
        { scale: 1.0, filter: 'blur(0px)', opacity: 1, duration: 0.08, ease: 'power2.out' },
        0.26
      );
      // Slow push continues — parallax speed 1
      masterTimeline.to(bgBaseRef.current, { scale: 1.08, duration: 0.26, ease: 'none' }, 0.29);

      // Dark overlay settles lighter
      masterTimeline.fromTo(darkOverlayRef.current,
        { opacity: 0.55 },
        { opacity: 0.18, duration: 0.07, ease: 'power1.out' },
        0.26
      );

      // === PEPPER CLOSE-UP: Macro focus reveal ===
      masterTimeline.fromTo(pepperCloseRef.current,
        { opacity: 0, filter: 'blur(20px)', scale: 1.08 },
        { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.05, ease: 'power2.out' },
        0.30
      );

      // Light caustic sweeps
      masterTimeline.fromTo(lightRayRef.current,
        { x: '-120%', opacity: 0 },
        { x: '120%', opacity: 0.5, duration: 0.06, ease: 'power1.inOut' },
        0.32
      );

      // Dewdrop flare
      masterTimeline.fromTo(dewdropRef.current,
        { opacity: 0, scale: 0.2 },
        { opacity: 1, scale: 1.8, duration: 0.015, ease: 'power3.out' },
        0.35
      );
      masterTimeline.to(dewdropRef.current, { opacity: 0, scale: 2.8, duration: 0.015, ease: 'power2.in' }, 0.365);

      // === NARRATIVE: Discovery text 1 ===
      masterTimeline.fromTo(textGroupRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.30
      );

      // Farmer hands appear — human connection
      masterTimeline.fromTo(farmerRef.current,
        { opacity: 0, filter: 'blur(8px)' },
        { opacity: 0.5, filter: 'blur(0px)', duration: 0.05, ease: 'power2.out' },
        0.34
      );

      // === MONSOON SEQUENCE ===
      masterTimeline.to(textGroupRef.current, { opacity: 0, duration: 0.03 }, 0.41);
      masterTimeline.to(farmerRef.current, { opacity: 0, duration: 0.03 }, 0.41);
      masterTimeline.to(darkOverlayRef.current, { opacity: 0.55, duration: 0.04, ease: 'power1.in' }, 0.42);
      masterTimeline.to(rainOverlayRef.current, { opacity: 0.65, duration: 0.04, ease: 'power1.in' }, 0.42);

      // Pepper turns red
      masterTimeline.fromTo(ripePepperRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.07, ease: 'power2.inOut' },
        0.44
      );

      // Rain clears
      masterTimeline.to(rainOverlayRef.current, { opacity: 0, duration: 0.04, ease: 'power1.out' }, 0.49);
      masterTimeline.to(darkOverlayRef.current, { opacity: 0.2, duration: 0.04, ease: 'power1.out' }, 0.49);

      // === NARRATIVE 2: Post-monsoon ===
      masterTimeline.fromTo(lifecycleTextRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.47
      );

      // === SCENE EXIT ===
      masterTimeline.to(lifecycleTextRef.current, { opacity: 0, duration: 0.03 }, 0.54);
      masterTimeline.to(sceneRef.current, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.55);
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      style={{ transformStyle: 'preserve-3d' }}
      aria-label="Discovering the Pepper Vines of Wayanad"
    >
      {/* === BASE: Wide plantation background === */}
      <div
        ref={bgBaseRef}
        className="absolute inset-0 origin-center will-change-transform"
      >
        <CinematicImage 
          asset={Assets.pepperRaw} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center center' }}
        />
      </div>

      {/* === CLOSE: Macro pepper cluster === */}
      <div
        ref={pepperCloseRef}
        className="absolute inset-0 origin-center will-change-transform opacity-0"
      >
        <CinematicImage 
          asset={Assets.greenPepper} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 38%', objectFit: 'cover' }}
        />
        {/* === Ripe pepper overlay === */}
        <div
          ref={ripePepperRef}
          className="absolute inset-0 opacity-0 will-change-opacity"
          style={{
            mixBlendMode: 'multiply',
            filter: 'saturate(1.8) brightness(0.75)'
          }}
        >
          <CinematicImage 
            asset={Assets.pepperPowder} 
            className="absolute inset-0 w-full h-full"
            style={{ objectPosition: 'center', objectFit: 'cover' }}
          />
        </div>

        {/* === Light Caustic Ray === */}
        <div
          ref={lightRayRef}
          className="absolute inset-y-0 left-0 will-change-transform pointer-events-none"
          style={{
            width: '40%',
            background: 'linear-gradient(90deg, transparent, rgba(212,180,80,0.55), transparent)',
            mixBlendMode: 'overlay',
            opacity: 0
          }}
        />

        {/* === Dewdrop Flare === */}
        <div
          ref={dewdropRef}
          className="absolute top-[40%] left-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform opacity-0"
          style={{
            width: '56px',
            height: '56px',
            background: 'radial-gradient(circle, rgba(255,255,240,0.95) 0%, rgba(212,180,80,0.65) 35%, transparent 65%)',
            mixBlendMode: 'color-dodge',
            filter: 'blur(2px)'
          }}
        />

        {/* === Monsoon Rain Overlay === */}
        <div
          ref={rainOverlayRef}
          className="absolute inset-0 opacity-0 will-change-opacity pointer-events-none"
          style={{
            background: 'linear-gradient(168deg, transparent 0px, transparent 6px, rgba(120,160,200,0.035) 6px, rgba(120,160,200,0.035) 7px)',
            backgroundSize: '100% 7px',
            backgroundColor: 'rgba(10,20,32,0.5)'
          }}
        />
      </div>

      {/* === FARMER HANDS === */}
      <div
        ref={farmerRef}
        className="absolute inset-0 will-change-transform opacity-0"
        style={{ mixBlendMode: 'luminosity' }}
      >
        <CinematicImage 
          asset={Assets.farmerHands} 
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 55%', objectFit: 'cover' }}
        />
      </div>

      {/* === Dark atmospheric overlay === */}
      <div
        ref={darkOverlayRef}
        className="absolute inset-0 pointer-events-none will-change-opacity"
        style={{ background: 'rgba(6,12,8,0.5)' }}
      />

      {/* === NARRATIVE STANZA 1 === */}
      <div
        ref={textGroupRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(8,14,8,0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 'clamp(1.5rem, 4vw, 2.8rem) clamp(1.5rem, 4vw, 3.5rem)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)'
          }}
        >
          <p className="font-sans tracking-[0.32em] uppercase mb-5" style={{ color: 'rgba(212,147,42,0.9)', fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)' }}>
            Hidden in the canopy
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
            The pure essence<br />
            <span className="italic" style={{ color: 'rgba(240,230,195,0.95)' }}>of Wayanad.</span>
          </h2>
          <p className="font-sans text-cream/65 mt-5 leading-relaxed" style={{ fontSize: 'clamp(0.82rem, 1.5vw, 0.95rem)' }}>
            Dense forests at 800 metres elevation. Morning mist on the leaves.
            The ancient vine that has fed the spice routes of the world.
          </p>
        </div>
      </div>

      {/* === NARRATIVE STANZA 2: Post-Monsoon === */}
      <div
        ref={lifecycleTextRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          className="cinematic-card text-center"
          style={{
            background: 'rgba(8,10,8,0.70)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.1)',
            padding: 'clamp(1.5rem, 4vw, 2.8rem) clamp(1.5rem, 4vw, 3.5rem)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55)'
          }}
        >
          <p className="font-sans tracking-[0.32em] uppercase mb-5" style={{ color: 'rgba(140,180,220,0.8)', fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)' }}>
            The Monsoon &amp; Ripening
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
            Nourished by rain.<br />
            <span className="italic" style={{ color: 'rgba(240,230,195,0.9)' }}>Perfected by time.</span>
          </h2>
          <p className="font-sans text-cream/60 mt-5 leading-relaxed max-w-sm mx-auto" style={{ fontSize: 'clamp(0.82rem, 1.5vw, 0.95rem)' }}>
            Heavy Kerala rains nourish the vines. Slowly the berries ripen
            from vibrant green to a rich sunset red — signaling the harvest.
          </p>
        </div>
      </div>
    </section>
  );
}
