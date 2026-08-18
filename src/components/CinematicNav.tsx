import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scrollToPercent, pauseLenis, resumeLenis, getLenisInstance } from '../core/lenisInstance';
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
  { label: 'Collection', pct: 0.88, scene: '05' },
];

export function CinematicNav() {
  const [visible, setVisible] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeScene, setActiveScene] = useState<number>(-1);
  const navRef = useRef<HTMLElement>(null);
  const prevVisibleRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayRafRef = useRef<number | null>(null);

  const getActiveScene = useCallback((pct: number): number => {
    if (pct >= 0.85) return 3; // Scene 5: Collection
    for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
      if (pct >= NAV_LINKS[i].pct - 0.02) return i;
    }
    return -1;
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Smooth Auto-Scroll — uses Lenis scrollTo to avoid bypassing the smooth scroll engine
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayRafRef.current) cancelAnimationFrame(autoPlayRafRef.current);
      return;
    }

    let lastTime = performance.now();
    // ~40px/sec — slow cinematic auto-tour pace
    const scrollSpeed = 0.65;

    const step = (now: number) => {
      const delta = Math.min(32, now - lastTime);
      lastTime = now;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentY = window.scrollY;

      if (currentY >= maxScroll - 5) {
        setIsAutoPlaying(false);
        return;
      }

      const targetY = Math.min(maxScroll, currentY + (scrollSpeed * delta) / 16);
      const lenis = getLenisInstance();
      if (lenis) {
        // Use Lenis.scrollTo to keep the smooth-scroll engine in sync
        lenis.scrollTo(targetY, { immediate: true });
      } else {
        window.scrollTo(0, targetY);
      }
      autoPlayRafRef.current = requestAnimationFrame(step);
    };

    autoPlayRafRef.current = requestAnimationFrame(step);

    // Pause auto-tour on any user interaction
    const stopOnUserAction = () => setIsAutoPlaying(false);
    window.addEventListener('wheel', stopOnUserAction, { passive: true, once: true });
    window.addEventListener('touchstart', stopOnUserAction, { passive: true, once: true });

    return () => {
      if (autoPlayRafRef.current) cancelAnimationFrame(autoPlayRafRef.current);
      window.removeEventListener('wheel', stopOnUserAction);
      window.removeEventListener('touchstart', stopOnUserAction);
    };
  }, [isAutoPlaying]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Cap pct to the cinematic scroll range (SceneManager = 800vh, sticky range = 700vh).
      // This prevents Collection's extra page height from skewing the nav thresholds.
      const cinematicMaxScroll = window.innerHeight * 7; // 700vh
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
    if (pct >= 0.85) {
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

          {/* Auto Play Presentation & WhatsApp CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleAutoPlay}
              className="inline-flex items-center font-sans transition-all duration-300 cursor-pointer"
              style={{
                fontSize: 'clamp(0.62rem, 1.1vw, 0.72rem)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: isAutoPlaying ? '#10B981' : 'rgba(253,246,236,0.7)',
                background: isAutoPlaying ? 'rgba(16,185,129,0.12)' : 'transparent',
                border: isAutoPlaying ? '1px solid rgba(16,185,129,0.6)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                padding: '0.5rem 1rem',
                minHeight: '36px',
                gap: '6px',
              }}
              title={isAutoPlaying ? 'Pause automatic cinematic tour' : 'Start automatic cinematic tour'}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isAutoPlaying ? '#10B981' : 'rgba(253,246,236,0.4)',
                  boxShadow: isAutoPlaying ? '0 0 8px #10B981' : 'none',
                }}
              />
              {isAutoPlaying ? 'Auto Tour: ON' : 'Auto Tour'}
            </button>

            {/* ENQUIRE Button with Luxury Dropdown Menu */}
            <div className="relative group">
              <button
                className="inline-flex items-center font-sans transition-all duration-300 cursor-pointer overflow-hidden relative group/btn"
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: '#F5E6C8',
                  background: 'linear-gradient(135deg, rgba(212,147,42,0.18) 0%, rgba(12,18,12,0.65) 100%)',
                  border: '1px solid rgba(212,147,42,0.5)',
                  borderRadius: '3px',
                  padding: '0.55rem 1.35rem',
                  minHeight: '38px',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)',
                }}
              >
                <span>Enquire</span>
                <svg
                  className="w-2.5 h-2.5 transition-transform duration-300 group-hover:rotate-180"
                  style={{ fill: '#D4932A' }}
                  viewBox="0 0 24 24"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>

              {/* Luxury Dropdown Card */}
              <div 
                className="absolute right-0 top-full mt-3 w-72 p-3 rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 ease-out"
                style={{
                  background: 'rgba(10, 14, 11, 0.96)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(212, 147, 42, 0.35)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.85), 0 0 20px rgba(212,147,42,0.12)',
                }}
              >
                <div className="px-3.5 py-2.5 border-b border-gold/15 mb-2">
                  <p className="font-sans text-[9px] uppercase tracking-[0.28em] text-gold/80 font-medium">
                    Concierge Contact
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <a
                    href="mailto:theprideofspices12@gmail.com?subject=Enquiry%20from%20Pride%20of%20Spices%20Website&body=Hello%2C%20I%20would%20like%20to%20enquire%20about%20your%20heritage%20spices%20and%20wild%20forest%20honey."
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/10 transition-all duration-200 group/item"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110"
                      style={{ background: 'rgba(234, 67, 53, 0.15)', border: '1px solid rgba(234, 67, 53, 0.35)' }}
                    >
                      <svg className="w-4 h-4 fill-[#EA4335]" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-cream group-hover/item:text-gold transition-colors">Gmail Enquiry</span>
                      <span className="text-[9.5px] text-cream/50 tracking-normal lowercase">theprideofspices12@gmail.com</span>
                    </div>
                  </a>

                  <a
                    href={`https://wa.me/919645401284?text=${encodeURIComponent("Hello Pride of Spices, I would like to enquire about your heritage spices & wild forest honey.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/10 transition-all duration-200 group/item"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110"
                      style={{ background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.35)' }}
                    >
                      <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                        <path d="M12.031 2c-5.514 0-9.999 4.486-9.999 10 0 1.763.458 3.483 1.332 5.006l-1.364 4.994 5.111-1.34c1.472.803 3.131 1.24 4.92 1.24 5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.273c-1.579 0-3.118-.423-4.453-1.222l-.319-.191-3.037.796.81-2.959-.209-.333c-.878-1.401-1.343-3.027-1.343-4.697 0-4.561 3.711-8.273 8.273-8.273s8.273 3.712 8.273 8.273-3.712 8.273-8.273 8.273zm4.531-6.177c-.249-.125-1.474-.728-1.703-.811-.229-.083-.396-.125-.563.125-.166.249-.645.811-.791.978-.146.166-.292.187-.541.062-.249-.125-1.054-.388-2.007-1.238-.742-.662-1.243-1.479-1.389-1.728-.146-.249-.016-.384.109-.508.113-.112.249-.292.374-.437.125-.146.166-.249.249-.416.083-.166.042-.312-.021-.437s-.563-1.358-.771-1.859c-.202-.489-.408-.423-.563-.431l-.479-.008c-.166 0-.437.062-.666.312-.229.249-.874.854-.874 2.083 0 1.229.895 2.416 1.02 2.583.125.166 1.761 2.689 4.267 3.771.596.257 1.061.411 1.424.526.598.19 1.142.163 1.572.099.48-.071 1.474-.603 1.682-1.186.208-.583.208-1.083.146-1.187-.063-.104-.229-.166-.479-.291z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-cream group-hover/item:text-gold transition-colors">WhatsApp Enquiry</span>
                      <span className="text-[9.5px] text-cream/50 tracking-normal capitalize">Direct message support</span>
                    </div>
                  </a>

                  <a
                    href="tel:+919645401284"
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/10 transition-all duration-200 group/item"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110"
                      style={{ background: 'rgba(212, 147, 42, 0.15)', border: '1px solid rgba(212, 147, 42, 0.35)' }}
                    >
                      <svg className="w-4 h-4 fill-gold" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-cream group-hover/item:text-gold transition-colors">Call Representative</span>
                      <span className="text-[9.5px] text-cream/50 tracking-normal capitalize">+91 96454 01284</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              onClick={() => {
                setMobileOpen(false);
                setIsAutoPlaying(true);
              }}
              className="font-sans uppercase"
              style={{
                fontSize: 'clamp(0.65rem, 1.4vw, 0.78rem)',
                letterSpacing: '0.24em',
                color: isAutoPlaying ? '#10B981' : '#FDF6EC',
                border: isAutoPlaying ? '1px solid rgba(16,185,129,0.6)' : '1px solid rgba(255,255,255,0.25)',
                background: isAutoPlaying ? 'rgba(16,185,129,0.12)' : 'transparent',
                borderRadius: '2px',
                padding: '0.875rem 2rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: mobileOpen ? 1 : 0,
                transition: 'opacity 0.4s ease 240ms',
                cursor: 'pointer',
              }}
            >
              {isAutoPlaying ? 'Pause Auto Tour' : 'Start Auto Tour'}
            </button>
            <a
              href="mailto:theprideofspices12@gmail.com?subject=Enquiry%20from%20Pride%20of%20Spices%20Website&body=Hello%2C%20I%20would%20like%20to%20enquire%20about%20your%20heritage%20spices%20and%20wild%20forest%20honey."
              className="font-sans uppercase"
              style={{
                fontSize: 'clamp(0.65rem, 1.4vw, 0.78rem)',
                letterSpacing: '0.24em',
                color: '#EA4335',
                border: '1px solid rgba(234,67,53,0.6)',
                background: 'rgba(234,67,53,0.1)',
                borderRadius: '2px',
                padding: '0.875rem 2rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: mobileOpen ? 1 : 0,
                transition: 'opacity 0.4s ease 260ms',
              }}
              onClick={() => setMobileOpen(false)}
            >
              Gmail: theprideofspices12@gmail.com
            </a>
            <a
              href={`https://wa.me/919645401284?text=${encodeURIComponent("Hello Pride of Spices, I would like to enquire about your heritage spices & wild forest honey.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans uppercase"
              style={{
                fontSize: 'clamp(0.65rem, 1.4vw, 0.78rem)',
                letterSpacing: '0.24em',
                color: '#D4932A',
                border: '1px solid rgba(212,147,42,0.6)',
                background: 'rgba(212,147,42,0.1)',
                borderRadius: '2px',
                padding: '0.875rem 2rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: mobileOpen ? 1 : 0,
                transition: 'opacity 0.4s ease 280ms',
              }}
              onClick={() => setMobileOpen(false)}
            >
              WhatsApp: +91 96454 01284
            </a>
            <a
              href="tel:+919645401284"
              className="font-sans uppercase"
              style={{
                fontSize: 'clamp(0.65rem, 1.4vw, 0.78rem)',
                letterSpacing: '0.24em',
                color: '#FDF6EC',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                padding: '0.875rem 2rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: mobileOpen ? 1 : 0,
                transition: 'opacity 0.4s ease 320ms',
              }}
              onClick={() => setMobileOpen(false)}
            >
              Call: +91 96454 01284
            </a>
          </div>
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
