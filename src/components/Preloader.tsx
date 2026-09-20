import React, { useState, useEffect } from 'react';
import { AssetLoader } from '@/core/assets/AssetLoader';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * PRELOADER — Version 3 (Production Polish)
 *
 * Critical improvements over v2:
 * 1. Waits for `document.fonts.ready` alongside image preload to guarantee
 *    no invisible-text flash when preloader dismisses.
 * 2. Shimmer progress bar: pulsing while loading, solid gold at 100%.
 * 3. Subtle cinematic grain overlay matches main experience aesthetic.
 * 4. Fade-out is gated behind both assets AND fonts being ready.
 */
export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    // Minimum display time for a premium loading experience
    const minTime = new Promise<void>(resolve => setTimeout(resolve, 1400));

    // Hard fallback timeout: guarantees preloader dismisses even if network or fonts hang
    const maxTimeout = new Promise<void>(resolve => setTimeout(resolve, 3500));

    // Poll image loading progress every 80ms
    const progressInterval = setInterval(() => {
      if (!isActive) return;
      const p = AssetLoader.getStageProgress(1);
      setProgress(Math.min(p, 99)); // Cap at 99 until everything resolves
    }, 80);

    Promise.race([
      Promise.all([
        AssetLoader.preloadStage(1),
        // Guarantee fonts are fully loaded before dismissing
        document.fonts.ready,
        minTime,
      ]),
      maxTimeout,
    ]).then(() => {
      if (!isActive) return;
      clearInterval(progressInterval);
      setProgress(100);
      setIsReady(true);

      // Brief pause at 100% so user sees the completed state
      setTimeout(() => {
        if (!isActive) return;
        setFadeOut(true);
        // Wait for CSS fade-out (750ms) + Lenis initialization buffer (150ms)
        // before refreshing ScrollTrigger bounds. Too early causes wrong scroll heights.
        setTimeout(() => {
          onComplete();
          setTimeout(() => {
            ScrollTrigger.refresh();
            // Warm-load product catalogue in the background so grid cards are cached ahead of scroll
            AssetLoader.preloadStage(3);
            setTimeout(() => AssetLoader.preloadStage(5), 1000);
          }, 200);
        }, 750);
      }, 450);
    });

    return () => {
      isActive = false;
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: '#0A120C',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.75s cubic-bezier(0.22, 0.61, 0.36, 1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
      role="status"
      aria-label="Loading the Pride of Spices experience"
      aria-live="polite"
    >
      {/* Grain overlay — matches main experience */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Ambient brand green glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '45vmin',
          height: '45vmin',
          background: 'radial-gradient(circle, rgba(1,128,57,0.10) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Central content */}
      <div className="relative flex flex-col items-center text-center">
        {/* Official SVG Logo Mark */}
        <div style={{ marginBottom: 'clamp(1.25rem, 3vh, 2rem)' }}>
          <img
            src="/images/logo.svg"
            alt="The Pride of Spices logo"
            style={{
              width: 'clamp(52px, 10vmin, 72px)',
              height: 'auto',
              color: '#018039',
              filter: 'invert(46%) sepia(64%) saturate(694%) hue-rotate(100deg) brightness(92%)',
              opacity: 0.85,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Brand wordmark */}
        <div style={{ marginBottom: 'clamp(2rem, 5vh, 3.5rem)' }}>
          <p
            className="font-sans tracking-[0.48em] uppercase"
            style={{
              fontSize: 'clamp(0.58rem, 1.2vw, 0.68rem)',
              marginBottom: '1.25rem',
              color: 'rgba(1,128,57,0.65)',
            }}
          >
            From the Heart of Wayanad
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              lineHeight: 0.93,
              letterSpacing: '-0.015em',
              color: '#F2F9F5',
            }}
          >
            The Pride
            <br />
            <span
              className="italic"
              style={{ color: '#018039', fontSize: '0.78em' }}
            >
              of Spices
            </span>
          </h1>
        </div>

        {/* Progress bar — brand green */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: 'clamp(120px, 28vw, 220px)',
            height: '1px',
            background: 'rgba(1,128,57,0.14)',
          }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Active fill */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'left',
              width: `${progress}%`,
              backgroundColor: isReady ? 'rgba(1,128,57,0.95)' : 'transparent',
              backgroundImage: isReady
                ? 'none'
                : 'linear-gradient(90deg, rgba(1,128,57,0.4) 0%, rgba(54,193,43,0.85) 50%, rgba(1,128,57,0.4) 100%)',
              backgroundSize: '200% 100%',
              animation: isReady ? 'none' : 'shimmer 2s linear infinite',
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        {/* Loading label */}
        <p
          className="font-sans tracking-[0.3em] uppercase"
          style={{
            fontSize: '0.58rem',
            marginTop: '1.5rem',
            color: 'rgba(242,249,245,0.25)',
          }}
        >
          {progress < 100 ? 'Entering the forest\u2026' : 'Ready'}
        </p>
      </div>
    </div>
  );
}
