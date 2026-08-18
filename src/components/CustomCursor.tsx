import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CUSTOM CURSOR — High performance GPU cursor dot & spring follower ring.
 *
 * v2 Fixes:
 * - Removed `isVisible` from useEffect dependency array — was causing the
 *   mousemove listener to be removed and re-added on every visibility change,
 *   which froze the cursor in the first fold.
 * - All cursor state is now managed through refs (no React re-renders in the
 *   hot path), driven exclusively by the GSAP ticker at 60/120 fps.
 * - Hides on touch / coarse-pointer devices.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);

  // Track everything as refs — zero re-renders in the mousemove path
  const posRef = useRef({ mx: -200, my: -200, rx: -200, ry: -200 });
  const stateRef = useRef({ visible: false, hovered: false });

  useEffect(() => {
    // Coarse-pointer = touch device — bail out entirely
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      isTouchRef.current = true;
      // Hide both elements permanently
      if (dotRef.current) dotRef.current.style.display = 'none';
      if (ringRef.current) ringRef.current.style.display = 'none';
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Keep dot + ring off-screen initially, will reveal on first move
    gsap.set([dot, ring], { x: -200, y: -200, opacity: 0 });

    const onMouseMove = (e: MouseEvent) => {
      posRef.current.mx = e.clientX;
      posRef.current.my = e.clientY;

      // Instant snap for precision inner dot
      gsap.set(dot, { x: e.clientX, y: e.clientY });

      // Reveal on first move
      if (!stateRef.current.visible) {
        stateRef.current.visible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
      }

      // Detect hover over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, [role="button"], input, select, textarea, [data-product-item], .btn-gold, .btn-ghost'
        );
        const nowHovered = !!interactive;
        if (nowHovered !== stateRef.current.hovered) {
          stateRef.current.hovered = nowHovered;
          // Animate ring size/style on hover change
          gsap.to(ring, {
            width: nowHovered ? 44 : 26,
            height: nowHovered ? 44 : 26,
            borderColor: nowHovered ? 'rgba(212,147,42,0.9)' : 'rgba(212,147,42,0.35)',
            borderWidth: nowHovered ? 1.5 : 1,
            backgroundColor: nowHovered ? 'rgba(212,147,42,0.08)' : 'transparent',
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      }
    };

    const onMouseLeave = () => {
      stateRef.current.visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25, overwrite: 'auto' });
    };

    const onMouseEnter = () => {
      stateRef.current.visible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.25, overwrite: 'auto' });
    };

    // ── Register listeners (passive — never blocks scroll) ──
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // ── Spring lerp loop on GSAP ticker ──
    const ticker = () => {
      const { mx, my } = posRef.current;
      posRef.current.rx += (mx - posRef.current.rx) * 0.15;
      posRef.current.ry += (my - posRef.current.ry) * 0.15;
      gsap.set(ring, { x: posRef.current.rx, y: posRef.current.ry });
    };
    gsap.ticker.add(ticker);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      gsap.ticker.remove(ticker);
    };
    // ✅ Empty deps — runs once on mount, never re-registers listeners
  }, []);

  return (
    <>
      {/* Precision inner dot — follows mouse instantly */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#D4932A',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 8px rgba(212,147,42,0.8)',
          willChange: 'transform',
        }}
      />

      {/* Spring follower ring — lags behind by lerp factor */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998]"
        style={{
          width: 26,
          height: 26,
          border: '1px solid rgba(212,147,42,0.35)',
          backgroundColor: 'transparent',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
