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
      // Initialize at opacity 0 — timeline controls reveal
      gsap.set(sceneRef.current, { opacity: 0, pointerEvents: 'none' });

      if (prefersReducedMotion) {
        masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.03 }, 0.26);
        masterTimeline.to(sceneRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.03 }, 0.54);
        return;
      }

      // === ENTRY at 24% scroll — full overlap with Scene2 exit ===
      masterTimeline.fromTo(sceneRef.current, { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto', duration: 0.08, ease: 'power2.inOut' }, 0.24);

      // Wide plantation background (GPU transform only)
      masterTimeline.fromTo(bgBaseRef.current,
        { scale: 1.08, opacity: 0.6 },
        { scale: 1.0, opacity: 1, duration: 0.08, ease: 'power2.out' },
        0.24
      );
      // Slow push continues
      masterTimeline.to(bgBaseRef.current, { scale: 1.06, duration: 0.28, ease: 'none' }, 0.28);

      // Balanced overlay (never near black)
      masterTimeline.fromTo(darkOverlayRef.current,
        { opacity: 0.4 },
        { opacity: 0.2, duration: 0.06, ease: 'power1.out' },
        0.25
      );

      // === PEPPER CLOSE-UP: Macro focus reveal ===
      masterTimeline.fromTo(pepperCloseRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1.0, duration: 0.06, ease: 'power2.out' },
        0.27
      );

      // Light caustic sweeps
      masterTimeline.fromTo(lightRayRef.current,
        { x: '-120%', opacity: 0 },
        { x: '120%', opacity: 0.45, duration: 0.06, ease: 'power1.inOut' },
        0.29
      );

      // Dewdrop flare
      masterTimeline.fromTo(dewdropRef.current,
        { opacity: 0, scale: 0.2 },
        { opacity: 1, scale: 1.6, duration: 0.015, ease: 'power3.out' },
        0.32
      );
      masterTimeline.to(dewdropRef.current, { opacity: 0, scale: 2.4, duration: 0.015, ease: 'power2.in' }, 0.335);

      // === NARRATIVE 1: Discovery text (active 0.28 to 0.40) ===
      masterTimeline.fromTo(textGroupRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.28
      );

      // Farmer hands appear gently
      masterTimeline.fromTo(farmerRef.current,
        { opacity: 0 },
        { opacity: 0.45, duration: 0.05, ease: 'power2.out' },
        0.32
      );

      // === MONSOON SEQUENCE (Text 1 fades out at 0.39, Monsoon peaks, Text 2 enters at 0.42) ===
      masterTimeline.to(textGroupRef.current, { opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.39);
      masterTimeline.to(farmerRef.current, { opacity: 0, duration: 0.03 }, 0.39);
      
      // Rain overlay without over-darkening
      masterTimeline.to(darkOverlayRef.current, { opacity: 0.38, duration: 0.04, ease: 'power1.in' }, 0.40);
      masterTimeline.to(rainOverlayRef.current, { opacity: 0.55, duration: 0.04, ease: 'power1.in' }, 0.40);

      // Pepper turns red
      masterTimeline.fromTo(ripePepperRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.06, ease: 'power2.inOut' },
        0.42
      );

      // Rain clears
      masterTimeline.to(rainOverlayRef.current, { opacity: 0, duration: 0.03, ease: 'power1.out' }, 0.46);
      masterTimeline.to(darkOverlayRef.current, { opacity: 0.22, duration: 0.03, ease: 'power1.out' }, 0.46);

      // === NARRATIVE 2: Post-monsoon (active 0.42 to 0.52) ===
      masterTimeline.fromTo(lifecycleTextRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' },
        0.42
      );

      // === SCENE EXIT: ends text at 0.52, scene exits 0.50–0.56 overlapping Scene4 ===
      masterTimeline.to(lifecycleTextRef.current, { opacity: 0, duration: 0.03, ease: 'power2.in' }, 0.52);
      masterTimeline.to(sceneRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.06, ease: 'power1.inOut' }, 0.50);
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      id="scene-discovery"
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
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
            background: 'rgba(4,10,6,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: '#E8B44D', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            Hidden in the canopy
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
            The pure essence<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>of Wayanad.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Dense mountain forests at 800 metres elevation. Morning mist clinging to ancient leaves.
            The original black pepper vine that has defined the global spice trade for centuries.
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
            background: 'rgba(4,10,8,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,147,42,0.25)',
            padding: 'clamp(1.75rem, 4vw, 2.75rem) clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: '0.75rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85)'
          }}
        >
          <p className="font-sans font-medium tracking-[0.34em] uppercase mb-4" style={{ color: 'rgba(160,200,240,0.9)', fontSize: 'clamp(0.72rem, 1.2vw, 0.82rem)' }}>
            The Monsoon &amp; Ripening
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
            Nourished by rain.<br />
            <span className="italic font-normal" style={{ color: '#E8B44D' }}>Perfected by time.</span>
          </h2>
          <p className="font-sans text-cream/90 mt-5 leading-relaxed max-w-lg mx-auto font-normal" style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65 }}>
            Torrential Kerala monsoons drench the vines with vital minerals. Slowly the pepper berries ripen
            from vibrant green to a rich sunset crimson — signaling the sacred harvest.
          </p>
        </div>
      </div>
    </section>
  );
}
