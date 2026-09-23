import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  scrollToScene,
  scrollToPixels,
  pauseLenis,
  resumeLenis,
  getLenisInstance,
} from '../core/lenisInstance';
import { getActiveSceneFromProgress } from '../core/sceneRegistry';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * CINEMATIC NAV — Version 4 (Single-Engine Architectural Rewrite)
 *
 * Requirements fulfilled:
 * 1. Persistent top navigation: Always rendered from load. Transparent on hero fold,
 *    transitions smoothly to frosted dark green once scrolling begins.
 * 2. Progress bar: Driven via GSAP quickSetter without triggering 60fps React state re-renders.
 * 3. Active scenes & link navigation: Single source of truth from sceneRegistry.
 * 4. Luxury Concierge Enquire: Accessible dropdown toggle with real button semantics,
 *    aria-haspopup="dialog", aria-expanded, keyboard Esc support, outside-click close.
 * 5. Cinematic Auto Tour: Uses sceneRegistry hold points, sequentially visits scenes with
 *    luxurious 2-3s travel and 4-5s dwell, aborts immediately on ANY user input.
 */

const NAV_LINKS = [
  { label: 'The Forest', sceneId: 'forest' },
  { label: 'The Discovery', sceneId: 'discovery' },
  { label: 'The Harvest', sceneId: 'harvest' },
  { label: 'Wild Honey', sceneId: 'honey' },
  { label: 'Collection', sceneId: 'collection' },
];

export function CinematicNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const enquireMenuRef = useRef<HTMLDivElement>(null);
  const autoTourAbortRef = useRef<(() => void) | null>(null);

  // ── 1. Scroll & Progress Tracking via GSAP quickSetter ───
  useEffect(() => {
    const setProgressScale = progressBarRef.current
      ? gsap.quickSetter(progressBarRef.current, 'scaleX')
      : null;

    let lastIdx = -1;

    const onScrollUpdate = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY > 40;
      setIsScrolled(prev => (prev !== scrolled ? scrolled : prev));

      // Calculate master timeline progress
      const st = ScrollTrigger.getById('master-scroll-trigger');
      let progress = 0;
      if (st && st.end > st.start) {
        progress = Math.max(0, Math.min(1, (scrollY - st.start) / (st.end - st.start)));
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progress = total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0;
      }

      if (setProgressScale) {
        setProgressScale(progress);
      }

      const activeIdx = getActiveSceneFromProgress(progress);
      if (activeIdx !== lastIdx) {
        lastIdx = activeIdx;
        setActiveSceneIdx(activeIdx);
      }
    };

    window.addEventListener('scroll', onScrollUpdate, { passive: true });
    onScrollUpdate(); // Initial check

    return () => {
      window.removeEventListener('scroll', onScrollUpdate);
    };
  }, []);

  // ── 2. Cinematic Auto Tour ───
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoTourAbortRef.current) {
        autoTourAbortRef.current();
        autoTourAbortRef.current = null;
      }
      return;
    }

    let isAborted = false;
    let tourTimeout: ReturnType<typeof setTimeout> | null = null;

    const abortTour = () => {
      if (isAborted) return;
      isAborted = true;
      if (tourTimeout) clearTimeout(tourTimeout);
      const _lenis = getLenisInstance();
      if (_lenis) {
        _lenis.scrollTo(_lenis.scroll, { immediate: true });
      }
      resumeLenis();
      setIsAutoPlaying(false);
    };

    autoTourAbortRef.current = abortTour;

    // Tour sequence through key scenes
    const tourSequence = ['forest', 'discovery', 'harvest', 'honey', 'collection'];
    let currentStep = 0;

    const runStep = () => {
      if (isAborted) return;

      if (currentStep >= tourSequence.length) {
        // Finished tour, return to top after brief pause
        tourTimeout = setTimeout(() => {
          if (!isAborted) {
            scrollToPixels(0, false, 2.5);
            setIsAutoPlaying(false);
          }
        }, 5000);
        return;
      }

      const nextSceneId = tourSequence[currentStep];
      // Travel duration 2.4s
      scrollToScene(nextSceneId, false, 2.4);

      currentStep++;
      // Dwell for 5.0s before moving to the next stop
      tourTimeout = setTimeout(runStep, 5400);
    };

    // Start first step after a gentle pause
    tourTimeout = setTimeout(runStep, 600);

    // Abort tour on any human interaction (wheel, touch, pointer, keydown)
    const onUserInteract = () => {
      abortTour();
    };

    window.addEventListener('wheel', onUserInteract, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteract, { passive: true, once: true });
    window.addEventListener('touchmove', onUserInteract, { passive: true, once: true });
    window.addEventListener('pointerdown', onUserInteract, { passive: true, once: true });
    window.addEventListener('keydown', onUserInteract, { once: true });

    return () => {
      isAborted = true;
      if (tourTimeout) clearTimeout(tourTimeout);
      window.removeEventListener('wheel', onUserInteract);
      window.removeEventListener('touchstart', onUserInteract);
      window.removeEventListener('touchmove', onUserInteract);
      window.removeEventListener('pointerdown', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
    };
  }, [isAutoPlaying]);

  // ── 3. Close Menus on Escape or Click Outside ───
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setEnquireOpen(false);
      }
    };

    const onClickOutside = (e: MouseEvent) => {
      if (
        enquireMenuRef.current &&
        !enquireMenuRef.current.contains(e.target as Node)
      ) {
        setEnquireOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      pauseLenis();
      return () => {
        resumeLenis();
      };
    }
  }, [mobileOpen]);

  const handleNavClick = useCallback((sceneId: string) => {
    if (isAutoPlaying) setIsAutoPlaying(false);
    setMobileOpen(false);
    setEnquireOpen(false);
    scrollToScene(sceneId);
  }, [isAutoPlaying]);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] transition-colors duration-500 will-change-transform"
        role="navigation"
        aria-label="Main navigation"
        id="main-nav"
      >
        {/* Scroll Progress Bar — brand green (transform GPU scaleX, 0 layout shifts) */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none bg-black/30"
        >
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left"
            style={{
              transform: 'scaleX(0)',
              background:
                'linear-gradient(90deg, rgba(1,128,57,0.3) 0%, rgba(1,128,57,1.0) 100%)',
            }}
          />
        </div>

        {/* Nav Bar Body */}
        <div
          className="flex items-center justify-between transition-all duration-500"
          style={{
            paddingLeft: 'clamp(1.25rem, 4vw, 3.5rem)',
            paddingRight: 'clamp(1.25rem, 4vw, 3.5rem)',
            paddingTop: 'max(0px, env(safe-area-inset-top))',
            minHeight: 'calc(58px + env(safe-area-inset-top))',
            background: isScrolled ? 'rgba(6,10,6,0.92)' : 'rgba(3,7,3,0.35)',
            backdropFilter: isScrolled ? 'blur(28px) saturate(1.4)' : 'blur(8px)',
            WebkitBackdropFilter: isScrolled ? 'blur(28px) saturate(1.4)' : 'blur(8px)',
            borderBottom: isScrolled
              ? '1px solid rgba(212,147,42,0.18)'
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Brand Wordmark with logo mark */}
          <button
            onClick={() => handleNavClick('arrival')}
            className="font-serif hover:opacity-90 transition-opacity duration-300 group"
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              letterSpacing: '0.02em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#F2F9F5',
            }}
            aria-label="The Pride of Spices - Return to beginning"
          >
            <img
              src="/images/logo.svg"
              alt=""
              aria-hidden="true"
              style={{
                width: 'clamp(24px, 3.5vw, 30px)',
                height: 'auto',
                filter:
                  'invert(46%) sepia(64%) saturate(694%) hue-rotate(100deg) brightness(92%)',
                opacity: 0.95,
                flexShrink: 0,
              }}
            />
            <span>
              The Pride{' '}
              <span className="italic" style={{ color: '#018039', marginLeft: '0.18em' }}>
                of Spices
              </span>
            </span>
          </button>

          {/* Desktop Nav Links + Progress Indicators */}
          <div className="hidden md:flex items-center" style={{ gap: 'clamp(1rem, 2vw, 1.75rem)' }}>
            {/* Scene progress dots */}
            <div className="flex items-center" style={{ gap: '6px' }} aria-hidden="true">
              {NAV_LINKS.map((link, i) => {
                const isCurrent = activeSceneIdx === i + 1;
                const isPassed = activeSceneIdx > i + 1;
                return (
                  <div
                    key={link.sceneId}
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
                        transform: isCurrent ? 'scaleX(1)' : 'scaleX(0.25)',
                        background: isCurrent
                          ? '#018039'
                          : isPassed
                            ? 'rgba(1,128,57,0.48)'
                            : 'rgba(255,255,255,0.22)',
                        transition:
                          'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), background 0.45s ease',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <ul role="list" className="flex items-center m-0 p-0 list-none" style={{ gap: 'clamp(1rem, 2vw, 1.75rem)' }}>
              {NAV_LINKS.map((link) => {
                const isCurrent = activeSceneIdx === NAV_LINKS.findIndex(l => l.sceneId === link.sceneId) + 1;
                return (
                  <li key={link.sceneId}>
                    <button
                      onClick={() => handleNavClick(link.sceneId)}
                      className="font-sans relative group"
                      style={{
                        fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: isCurrent ? '#018039' : 'rgba(242,249,245,0.72)',
                        transition: 'color 0.3s ease',
                        padding: '8px 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: isCurrent ? 600 : 500,
                      }}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      {link.label}
                      <span
                        className="absolute -bottom-0.5 left-0 h-[1.5px] w-full"
                        style={{
                          background: '#018039',
                          transformOrigin: 'left',
                          transform: isCurrent ? 'scaleX(1)' : 'scaleX(0)',
                          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Auto Tour & Enquire Concierge */}
          <div className="hidden md:flex items-center gap-3">
            {/* Auto Tour Toggle */}
            <button
              onClick={() => setIsAutoPlaying(prev => !prev)}
              className="inline-flex items-center font-sans transition-all duration-300 cursor-pointer"
              style={{
                fontSize: 'clamp(0.65rem, 1.1vw, 0.74rem)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: isAutoPlaying ? '#10B981' : '#FDF6EC',
                background: isAutoPlaying ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)',
                border: isAutoPlaying ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.22)',
                borderRadius: '3px',
                padding: '0.5rem 1.1rem',
                minHeight: '38px',
                gap: '8px',
              }}
              aria-pressed={isAutoPlaying}
              title={isAutoPlaying ? 'Pause automatic tour' : 'Start automatic cinematic tour'}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isAutoPlaying ? '#10B981' : 'rgba(253,246,236,0.6)',
                  boxShadow: isAutoPlaying ? '0 0 10px #10B981' : 'none',
                }}
              />
              {isAutoPlaying ? 'Auto Tour: ON' : 'Auto Tour'}
            </button>

            {/* Concierge Enquire Dropdown */}
            <div ref={enquireMenuRef} className="relative">
              <button
                onClick={() => setEnquireOpen(prev => !prev)}
                aria-haspopup="dialog"
                aria-expanded={enquireOpen}
                className="inline-flex items-center font-sans transition-all duration-300 cursor-pointer"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: '#F5E6C8',
                  background:
                    'linear-gradient(135deg, rgba(212,147,42,0.28) 0%, rgba(12,18,12,0.85) 100%)',
                  border: '1px solid rgba(212,147,42,0.65)',
                  borderRadius: '3px',
                  padding: '0.55rem 1.4rem',
                  minHeight: '38px',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                }}
              >
                <span>Enquire</span>
                <svg
                  className="w-2.5 h-2.5 transition-transform duration-300"
                  style={{
                    fill: '#D4932A',
                    transform: enquireOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  viewBox="0 0 24 24"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>

              {/* Dropdown Menu Card */}
              {enquireOpen && (
                <div
                  className="absolute right-0 top-full mt-2.5 w-76 p-3 rounded-lg z-[120]"
                  style={{
                    background: 'rgba(8, 12, 9, 0.98)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(212, 147, 42, 0.45)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 24px rgba(212,147,42,0.18)',
                  }}
                  role="dialog"
                  aria-label="Direct Concierge Enquiry"
                >
                  <div className="px-3.5 py-2.5 border-b border-gold/20 mb-2">
                    <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-gold font-semibold">
                      Concierge Contact
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href="mailto:theprideofspices12@gmail.com?subject=Enquiry%20from%20Pride%20of%20Spices%20Website&body=Hello%2C%20I%20would%20like%20to%20enquire%20about%20your%20heritage%20spices%20and%20wild%20forest%20honey."
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/15 transition-all duration-200"
                      onClick={() => setEnquireOpen(false)}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(234, 67, 53, 0.18)',
                          border: '1px solid rgba(234, 67, 53, 0.45)',
                        }}
                      >
                        <svg className="w-4 h-4 fill-[#EA4335]" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-cream">Gmail Enquiry</span>
                        <span className="text-[10px] text-cream/60 tracking-normal lowercase">
                          theprideofspices12@gmail.com
                        </span>
                      </div>
                    </a>

                    <a
                      href={`https://wa.me/919645401284?text=${encodeURIComponent(
                        'Hello Pride of Spices, I would like to enquire about your heritage spices & wild forest honey.'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/15 transition-all duration-200"
                      onClick={() => setEnquireOpen(false)}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(37, 211, 102, 0.18)',
                          border: '1px solid rgba(37, 211, 102, 0.45)',
                        }}
                      >
                        <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                          <path d="M12.031 2c-5.514 0-9.999 4.486-9.999 10 0 1.763.458 3.483 1.332 5.006l-1.364 4.994 5.111-1.34c1.472.803 3.131 1.24 4.92 1.24 5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.273c-1.579 0-3.118-.423-4.453-1.222l-.319-.191-3.037.796.81-2.959-.209-.333c-.878-1.401-1.343-3.027-1.343-4.697 0-4.561 3.711-8.273 8.273-8.273s8.273 3.712 8.273 8.273-3.712 8.273-8.273 8.273zm4.531-6.177c-.249-.125-1.474-.728-1.703-.811-.229-.083-.396-.125-.563.125-.166.249-.645.811-.791.978-.146.166-.292.187-.541.062-.249-.125-1.054-.388-2.007-1.238-.742-.662-1.243-1.479-1.389-1.728-.146-.249-.016-.384.109-.508.113-.112.249-.292.374-.437.125-.146.166-.249.249-.416.083-.166.042-.312-.021-.437s-.563-1.358-.771-1.859c-.202-.489-.408-.423-.563-.431l-.479-.008c-.166 0-.437.062-.666.312-.229.249-.874.854-.874 2.083 0 1.229.895 2.416 1.02 2.583.125.166 1.761 2.689 4.267 3.771.596.257 1.061.411 1.424.526.598.19 1.142.163 1.572.099.48-.071 1.474-.603 1.682-1.186.208-.583.208-1.083.146-1.187-.063-.104-.229-.166-.479-.291z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-cream">WhatsApp Concierge</span>
                        <span className="text-[10px] text-cream/60 tracking-normal capitalize">
                          +91 96454 01284
                        </span>
                      </div>
                    </a>

                    <a
                      href="tel:+919645401284"
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-md font-sans text-xs tracking-wider uppercase text-cream/90 hover:text-gold hover:bg-gold/15 transition-all duration-200"
                      onClick={() => setEnquireOpen(false)}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(212, 147, 42, 0.18)',
                          border: '1px solid rgba(212, 147, 42, 0.45)',
                        }}
                      >
                        <svg className="w-4 h-4 fill-gold" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-cream">Phone Representative</span>
                        <span className="text-[10px] text-cream/60 tracking-normal capitalize">
                          Direct Line
                        </span>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger — 44px min touch target */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5"
            style={{
              padding: '12px',
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
              className="block w-6 bg-cream"
              style={{
                height: '2px',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                transform: mobileOpen ? 'translateY(6px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-6 bg-cream"
              style={{
                height: '2px',
                transition: 'opacity 0.2s ease',
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-6 bg-cream"
              style={{
                height: '2px',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                transform: mobileOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        id="mobile-menu"
        className="fixed inset-0 z-[99] md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        style={{
          background: 'rgba(4,8,5,0.98)',
          backdropFilter: 'blur(32px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transform: mobileOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        <div
          className="flex flex-col items-center justify-center h-full"
          style={{
            gap: 'clamp(1.25rem, 3.5vh, 2rem)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Brand header */}
          <div
            className="absolute left-6 flex items-center gap-2"
            style={{ top: 'calc(1.2rem + env(safe-area-inset-top))' }}
          >
            <img
              src="/images/logo.svg"
              alt=""
              aria-hidden="true"
              style={{
                width: '24px',
                height: 'auto',
                filter:
                  'invert(46%) sepia(64%) saturate(694%) hue-rotate(100deg) brightness(92%)',
                opacity: 0.85,
              }}
            />
            <p className="font-serif text-sm text-cream/70">
              The Pride <span className="italic text-brand-green">of Spices</span>
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute font-sans uppercase text-cream/70 hover:text-cream transition-colors"
            style={{
              top: 'calc(1.1rem + env(safe-area-inset-top))',
              right: '1.5rem',
              fontSize: '0.75rem',
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

          <ul role="list" className="flex flex-col items-center m-0 p-0 list-none" style={{ gap: 'clamp(0.5rem, 1.5vh, 1rem)' }}>
            {NAV_LINKS.map(link => (
              <li key={link.sceneId}>
                <button
                  onClick={() => handleNavClick(link.sceneId)}
                  className="font-serif text-cream hover:text-gold transition-colors duration-200"
                  style={{
                    fontSize: 'clamp(1.65rem, 7vw, 2.5rem)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem 1.5rem',
                  }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <div
            style={{
              width: '2.5rem',
              height: '1px',
              background: 'rgba(212,147,42,0.4)',
              margin: '0.5rem 0',
            }}
          />

          <div className="flex flex-col gap-2.5 items-stretch w-full" style={{ maxWidth: '300px' }}>
            <button
              onClick={() => {
                setMobileOpen(false);
                setIsAutoPlaying(true);
              }}
              className="font-sans uppercase font-medium"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                color: isAutoPlaying ? '#10B981' : '#FDF6EC',
                border: isAutoPlaying
                  ? '1px solid rgba(16,185,129,0.7)'
                  : '1px solid rgba(255,255,255,0.3)',
                background: isAutoPlaying ? 'rgba(16,185,129,0.15)' : 'transparent',
                borderRadius: '3px',
                padding: '0.85rem 1.25rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isAutoPlaying ? 'Pause Auto Tour' : 'Start Auto Tour'}
            </button>
            <a
              href="mailto:theprideofspices12@gmail.com"
              className="font-sans uppercase text-center"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                color: '#EA4335',
                border: '1px solid rgba(234,67,53,0.6)',
                background: 'rgba(234,67,53,0.12)',
                borderRadius: '3px',
                padding: '0.85rem 1.25rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              onClick={() => setMobileOpen(false)}
            >
              Gmail Enquiry
            </a>
            <a
              href={`https://wa.me/919645401284?text=${encodeURIComponent(
                'Hello Pride of Spices, I would like to enquire about your heritage spices & wild forest honey.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans uppercase text-center"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                color: '#25D366',
                border: '1px solid rgba(37,211,102,0.65)',
                background: 'rgba(37,211,102,0.12)',
                borderRadius: '3px',
                padding: '0.85rem 1.25rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              onClick={() => setMobileOpen(false)}
            >
              WhatsApp Concierge
            </a>
            <a
              href="tel:+919645401284"
              className="font-sans uppercase text-center"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                color: '#D4932A',
                border: '1px solid rgba(212,147,42,0.65)',
                background: 'rgba(212,147,42,0.12)',
                borderRadius: '3px',
                padding: '0.85rem 1.25rem',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              onClick={() => setMobileOpen(false)}
            >
              Phone: +91 96454 01284
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
