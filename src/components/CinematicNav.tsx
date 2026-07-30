import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scrollToPercent, pauseLenis, resumeLenis } from '../core/lenisInstance';
import gsap from 'gsap';

/**
 * CINEMATIC NAV — Version 3 (Production Polish)
 *
 * Key improvements over v2:
 * 1. Scene progress dots now use `scaleX` (GPU-only) instead of width transitions
 *    — eliminates layout shifts when dot expands from 4px to 16px.
 * 2. All dot containers have a fixed width (16px), so siblings never shift.
 * 3. Mobile hamburger lines have `min-height: 44px` container for WCAG touch targets.
 * 4. Mobile menu sets `aria-hidden` when closed to hide from AT.
 * 5. Hover underline on desktop uses `scaleX` for GPU compositing.
 */

interface NavLink {
  label: string;
  pct: number;
  scene: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'The Forest', pct: 0.13, scene: '02' },
  { label: 'The Harvest', pct: 0.52, scene: '04' },
  { label: 'Wild Honey', pct: 0.70, scene: '4.5' },
  { label: 'Collection', pct: 0.96, scene: '05' },
];

export function CinematicNav() {
  const [visible, setVisible] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<number>(-1);
  const navRef = useRef<HTMLElement>(null);
  const prevVisibleRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getActiveScene = useCallback((pct: number): number => {
    if (pct >= 0.94) return 3; // Scene 5: Collection
    for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
      if (pct >= NAV_LINKS[i].pct - 0.02) return i;
    }
    return -1;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Cap pct to the cinematic scroll range (SceneManager = 900vh, sticky range = 800vh).
      // This prevents Collection's extra page height from skewing the nav thresholds.
      const cinematicMaxScroll = window.innerHeight * 8; // 800vh
      const pct = cinematicMaxScroll > 0 ? Math.min(1, scrollY / cinematicMaxScroll) : 0;

      setScrollPct(maxScroll > 0 ? scrollY / maxScroll : 0); // progress bar still uses full range
      setVisible(pct > 0.12);
      setActiveScene(getActiveScene(pct));

      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 180);
    };

    // Use native window scroll: Lenis dispatches real scroll events to window,
    // so this works correctly on both desktop (Lenis-driven) and mobile (native).
    // This removes the fragile getLenisInstance() timing dependency.
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [getActiveScene]);

  // Animate nav in/out with GSAP — GPU-accelerated
  useEffect(() => {
    if (!navRef.current) return;
    if (visible === prevVisibleRef.current) return;
    prevVisibleRef.current = visible;

    gsap.to(navRef.current, {
      y: visible ? 0 : -80,
      opacity: visible ? 1 : 0,
      duration: 0.65,
      ease: 'power2.inOut',
    });
  }, [visible]);

  // Close mobile menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when mobile menu is open.
  useEffect(() => {
    if (mobileOpen) {
      pauseLenis();
      return () => {
        resumeLenis();
      };
    }
  }, [mobileOpen]);

  const scrollToPct = useCallback((pct: number) => {
    if (pct >= 0.95) {
      const collectionEl = document.getElementById('collection');
      if (collectionEl) {
        const top = collectionEl.getBoundingClientRect().top + window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollToPercent(Math.min(1, top / maxScroll));
        setMobileOpen(false);
        return;
      }
    }
    scrollToPercent(pct);
    setMobileOpen(false);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] will-change-transform"
        style={{ transform: 'translateY(-80px)', opacity: 0, pointerEvents: visible ? 'auto' : 'none' }}
        role="navigation"
        aria-label="Main navigation"
        id="main-nav"
      >
        {/* Scroll Progress Bar */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[1.5px] pointer-events-none"
          style={{
            width: `${scrollPct * 100}%`,
            background: 'linear-gradient(90deg, rgba(212,147,42,0.0) 0%, rgba(212,147,42,0.85) 100%)',
            transition: 'width 0.12s linear',
          }}
        />

        {/* Nav Bar Body — padded to account for Dynamic Island / notch via safe-area-inset-top */}
        <div
          className="flex items-center justify-between"
          style={{
            paddingLeft: 'clamp(1.25rem, 4vw, 3.5rem)',
            paddingRight: 'clamp(1.25rem, 4vw, 3.5rem)',
            paddingTop: 'max(0px, env(safe-area-inset-top))',
            // Height expands when there is a safe-area inset (notch devices)
            minHeight: 'calc(56px + env(safe-area-inset-top))',
            background: isScrolling ? 'rgba(6,10,6,0.92)' : 'rgba(8,12,8,0.78)',
            backdropFilter: isScrolling ? 'blur(32px) saturate(1.4)' : 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: isScrolling ? 'blur(32px) saturate(1.4)' : 'blur(20px) saturate(1.2)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
          }}
        >
          {/* Brand Wordmark */}
          <button
            onClick={() => scrollToPct(0)}
            className="font-serif text-cream/85 hover:text-cream transition-colors duration-300"
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              letterSpacing: '0.02em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Return to beginning"
          >
            The Pride{' '}
            <span className="italic" style={{ color: '#D4932A', marginLeft: '0.25em' }}>of Spices</span>
          </button>

          {/* Desktop Nav Links + Scene Progress Dots */}
          <div className="hidden md:flex items-center" style={{ gap: 'clamp(1rem, 2vw, 1.75rem)' }}>
            {/* 
              Scene progress dots: each dot has a FIXED 16px container.
              The inner pill uses scaleX(1) ↔ scaleX(0.25) to animate
              between 16px (active) and 4px (inactive) — zero layout shift.
            */}
            <div className="flex items-center" style={{ gap: '6px' }} aria-hidden="true">
              {NAV_LINKS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '16px',
                    height: '4px',
                    overflow: 'hidden',
                    borderRadius: '9999px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '9999px',
                      transformOrigin: 'left center',
                      transform: activeScene === i ? 'scaleX(1)' : 'scaleX(0.25)',
                      background: activeScene === i
                        ? 'rgba(212,147,42,0.92)'
                        : activeScene > i
                          ? 'rgba(212,147,42,0.42)'
                          : 'rgba(255,255,255,0.2)',
                      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.45s ease',
                    }}
                  />
                </div>
              ))}
            </div>

            {NAV_LINKS.map((link, i) => (
              <button
                key={link.label}
                onClick={() => scrollToPct(link.pct)}
                className="font-sans relative group"
                style={{
                  fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: activeScene === i ? 'rgba(212,147,42,0.98)' : 'rgba(253,246,236,0.45)',
                  transition: 'color 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-current={activeScene === i ? 'true' : undefined}
              >
                {link.label}
                {/* Active underline — scaleX from left (GPU only) */}
                <span
                  className="absolute -bottom-0.5 left-0 h-[1px] w-full"
                  style={{
                    background: 'rgba(212,147,42,0.75)',
                    transformOrigin: 'left',
                    transform: activeScene === i ? 'scaleX(1)' : 'scaleX(0)',
                    transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          {/* Enquire CTA */}
          <a
            href="mailto:hello@prideofspices.com"
            className="hidden md:inline-flex items-center font-sans transition-all duration-300"
            style={{
              fontSize: 'clamp(0.62rem, 1.1vw, 0.72rem)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#D4932A',
              border: '1px solid rgba(212,147,42,0.35)',
              borderRadius: '2px',
              padding: '0.5rem 1.25rem',
              minHeight: '36px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(212,147,42,0.09)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,147,42,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,147,42,0.35)';
            }}
          >
            Enquire
          </a>

          {/* Mobile Hamburger — 44px min touch target */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5"
            style={{
              padding: '12px 4px 12px 12px',
              minHeight: '44px',
              minWidth: '44px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <span
              className="block w-5 bg-cream/70"
              style={{
                height: '1.5px',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-5 bg-cream/70"
              style={{
                height: '1.5px',
                transition: 'transform 0.3s ease, opacity 0.2s ease',
                opacity: mobileOpen ? 0 : 1,
                transform: mobileOpen ? 'scaleX(0)' : 'none',
              }}
            />
            <span
              className="block w-5 bg-cream/70"
              style={{
                height: '1.5px',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        className="fixed inset-0 z-[99] md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        style={{
          background: 'rgba(6,10,6,0.97)',
          backdropFilter: 'blur(28px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {/* Add safe area insets to mobile menu content so it doesn't clash with Dynamic Island or home indicator */}
        <div
          className="flex flex-col items-center justify-center h-full"
          style={{
            gap: 'clamp(1.5rem, 4vh, 2.5rem)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Brand */}
          <p
            className="font-serif text-cream/30 absolute left-6"
            style={{
              top: 'calc(1.5rem + env(safe-area-inset-top))',
              fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
            }}
          >
            The Pride <span className="italic" style={{ color: 'rgba(212,147,42,0.6)' }}>of Spices</span>
          </p>

          {NAV_LINKS.map((link, i) => (
            <button
              key={link.label}
              onClick={() => scrollToPct(link.pct)}
              className="font-serif text-cream/75 hover:text-cream transition-all duration-300"
              style={{
                fontSize: 'clamp(1.75rem, 8vw, 3rem)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minHeight: '56px',
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 2rem',
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
                transition: `color 0.3s ease, opacity 0.4s ease ${i * 65}ms, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 65}ms`,
              }}
            >
              {link.label}
            </button>
          ))}

          <div style={{ width: '2rem', height: '1px', background: 'rgba(212,147,42,0.3)', marginTop: '0.5rem' }} />

          <a
            href="mailto:hello@prideofspices.com"
            className="font-sans uppercase"
            style={{
              fontSize: 'clamp(0.65rem, 1.4vw, 0.78rem)',
              letterSpacing: '0.28em',
              color: '#D4932A',
              border: '1px solid rgba(212,147,42,0.4)',
              borderRadius: '2px',
              padding: '0.875rem 2.5rem',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              opacity: mobileOpen ? 1 : 0,
              transition: 'opacity 0.4s ease 280ms',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Make an Enquiry
          </a>
        </div>

        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute font-sans uppercase text-cream/50 hover:text-cream/90 transition-colors"
          style={{
            top: 'calc(1.25rem + env(safe-area-inset-top))',
            right: '1.5rem',
            fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)',
            letterSpacing: '0.22em',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          aria-label="Close menu"
        >
          Close
        </button>
      </div>
    </>
  );
}
