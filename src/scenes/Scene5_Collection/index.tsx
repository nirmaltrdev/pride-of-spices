import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ProductOverlay, ProductData } from '../../components/ProductOverlay';
import { scrollToPercent } from '../../core/lenisInstance';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/** The complete product catalogue — 13 Heritage Spices & Honey */
const PRODUCTS: ProductData[] = [
  {
    id: 'black-pepper',
    name: 'Premium Black Pepper',
    origin: 'Western Ghats, Wayanad — 800m elevation',
    harvestStory:
      'Hand-harvested from ancient vines growing deep within the biosphere reserve. Only the heaviest, fully mature berries are selected by experienced pickers.',
    craftsmanship:
      'Sun-dried for 7 days on traditional bamboo mats, allowing natural enzymes to slowly cure the skin into a deep, rich black — locking in fierce volatile oils.',
    aroma: 'Sharp, piney, and fiercely warm with a distinct citrus undertone and lingering heat.',
    image: Assets.blackPepper,
    gallery: [],
  },
  {
    id: 'cardamom',
    name: 'Green Cardamom',
    origin: 'High Elevations of the Biosphere — 1,200m',
    harvestStory:
      'Foraged from the misty, high-altitude slopes. Only the fully ripe pods are hand-clipped to ensure maximum essential oil content.',
    craftsmanship:
      'Cured in warm-air chambers to lock in the vibrant green colour and the intense camphoraceous aroma.',
    aroma: 'Intensely fragrant, sweet-spicy with notes of eucalyptus and mint.',
    image: Assets.cardamom,
    gallery: [],
  },
  {
    id: 'clove',
    name: 'Cloves',
    origin: 'Spice Gardens, Wayanad',
    harvestStory:
      'Harvested precisely when the bud turns from green to a soft pink — before opening. Timing is critical to preserve the eugenol content.',
    craftsmanship:
      'Sun-dried over several days until each bud turns a deep reddish-brown. The intense essential oil content makes these some of the most fragrant cloves available.',
    aroma: 'Intensely warm, woody, and sweet with a powerful, long-lasting heat.',
    image: Assets.clove,
    gallery: [],
  },
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    origin: 'Wayanad River Valleys',
    harvestStory:
      'Harvested exclusively at dawn when the sap runs highest. The outer bark is carefully stripped away to reveal the sweet, parchment-thin inner layer.',
    craftsmanship:
      'Hand-peeled and rolled by generational craftsmen. Dried slowly in the shade to preserve the delicate volatile sweet oils.',
    aroma: 'Delicately sweet, warm, and highly aromatic without the harshness of Cassia.',
    image: Assets.cinnamon,
    gallery: [],
  },
  {
    id: 'nutmeg',
    name: 'Nutmeg',
    origin: 'Tropical Groves, Wayanad',
    harvestStory:
      'The fruit splits naturally when fully ripe, revealing the vivid red mace lacing around the inner seed. Both are harvested simultaneously.',
    craftsmanship:
      'Dried slowly over 6–8 weeks in natural shade. The mace is carefully separated and dried separately to preserve its individual character.',
    aroma: 'Warm, nutty, slightly sweet with a clean, peppery finish.',
    image: Assets.nutmeg,
    gallery: [],
  },
  {
    id: 'mace',
    name: 'Mace',
    origin: 'Tropical Groves, Wayanad',
    harvestStory:
      'The delicate, lacy crimson aril wrapped around the nutmeg seed, harvested by hand at peak ripeness.',
    craftsmanship:
      'Separated by hand and sun-dried until it turns a deep amber-gold, preserving its complex volatile essential oils.',
    aroma: 'Warm, delicate, and savory with sweet pine and subtle citrus overtones.',
    image: Assets.mace,
    gallery: [],
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    origin: 'Forest Fringe Farms, Wayanad',
    harvestStory:
      'Grown in the shade of the forest canopy in rich, loamy soil. Harvested after 9 months when the rhizomes reach full maturity.',
    craftsmanship:
      'Boiled, dried, and ground using traditional stone mills that preserve the curcumin-rich oils more effectively than industrial milling.',
    aroma: 'Warm, earthy, and pungent with a distinctive golden pigment that stains everything it touches.',
    image: Assets.turmeric,
    gallery: [],
  },
  {
    id: 'ginger',
    name: 'Ginger',
    origin: 'High-Altitude Terraces, Wayanad',
    harvestStory:
      'Cultivated in rich, organic forest topsoil with zero synthetic inputs. Hand-dug at full maturity for optimal gingerol content.',
    craftsmanship:
      'Washed in mountain river stream water and shade-dried to retain fiery heat and volatile aromatics.',
    aroma: 'Sharp, zesty, warm, and intensely aromatic with a lingering fiery finish.',
    image: Assets.ginger,
    gallery: [],
  },
  {
    id: 'red-chilli',
    name: 'Red Chilli',
    origin: 'Sunlit Slopes, Wayanad',
    harvestStory:
      'Hand-selected heirloom red chillies picked at full crimson maturity for rich color and intense natural heat.',
    craftsmanship:
      'Sun-dried on traditional woven mats to concentrate capsaicin oils and preserve brilliant natural pigmentation.',
    aroma: 'Fierce, smoky-sweet, and vibrant with deep persistent heat.',
    image: Assets.redChilli,
    gallery: [],
  },
  {
    id: 'coriander',
    name: 'Coriander',
    origin: 'Bio-Diverse Valleys, Wayanad',
    harvestStory:
      'Harvested from non-GMO heritage crops grown alongside aromatic shade trees in the Western Ghats.',
    craftsmanship:
      'Threshed by hand and slow-cured to lock in citrusy essential oils and woody warmth.',
    aroma: 'Fresh, citrusy, and warm with subtle sage and sweet floral notes.',
    image: Assets.coriander,
    gallery: [],
  },
  {
    id: 'cumin',
    name: 'Cumin',
    origin: 'Dry Forest Fringes, Wayanad',
    harvestStory:
      'Sourced from heirloom seeds cultivated in micro-climates ideal for high essential oil concentration.',
    craftsmanship:
      'Traditional shade-drying preserves volatile cuminaldehyde compound responsible for intense aroma.',
    aroma: 'Intensely earthy, nutty, and pungent with a warm bitter-sweet warmth.',
    image: Assets.cumin,
    gallery: [],
  },
  {
    id: 'crushed-pepper',
    name: 'Crushed Pepper',
    origin: 'Ancestral Homesteads, Wayanad',
    harvestStory:
      'Coarsely cracked heritage whole black peppercorns prepared in small batches to preserve sharp aroma and intense heat.',
    craftsmanship:
      'Traditional granite-milled cracked peppercorns that release fresh volatile piperine oils instantly upon opening.',
    aroma: 'Sharp, robust, fiercely aromatic with bold rustic pungency and lingering woody warmth.',
    image: Assets.spiceBlends,
    gallery: [],
  },
  {
    id: 'honey',
    name: 'Pure Forest Honey',
    origin: 'Deep Forests of Wayanad — Nilgiri Biosphere',
    harvestStory:
      'Sourced from the giant rock bees (Apis dorsata). Harvested by the Kattunayakan indigenous tribes using sustainable ancestral methods.',
    craftsmanship:
      'Raw, unfiltered, and unpasteurized. Each batch carries the unique floral signature of the seasonal forest bloom from which the bees feed.',
    aroma: 'Deeply floral, earthy, and richly complex with a dark, resinous finish.',
    image: Assets.forestHoney,
    gallery: [],
  },
];

/**
 * SCENE 5: THE COLLECTION — Single-Scroll Architecture
 *
 * This scene lives OUTSIDE the SceneManager sticky container so it occupies
 * real page flow. Its entry animations are driven by a dedicated ScrollTrigger
 * (not the master timeline), and Lenis is the single scroll controller.
 *
 * Animation budget (per project rules):
 *   Primary (2 max):  curtain fade-out + bg camera-focus-in
 *   Secondary (3 max): header reveal, card stagger, footer reveal
 *   Particle / overlay: light bloom
 */
export function Scene5_Collection() {
  const prefersReducedMotion = useReducedMotion();
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sceneRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headerOuterRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  // revealTlRef bridges useLayoutEffect (where GSAP context lives) and
  // useEffect (where IntersectionObserver triggers it).
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!sceneRef.current) return;

    const ctx = gsap.context(() => {
      const sel = gsap.utils.selector(sceneRef);
      const productItems = sel('[data-product-item]');

      // ── Initial States ──────────────────────────────────────────────────
      gsap.set(curtainRef.current, { opacity: 0 });
      gsap.set(bgRef.current, { scale: 1.0, filter: 'blur(0px)' });
      gsap.set(lightRef.current, { opacity: 0.42, scale: 1.0 });

      if (prefersReducedMotion) {
        gsap.set(curtainRef.current, { opacity: 0 });
        return;
      }

      // Set initial hidden states so elements don't flash before animation fires
      gsap.set(headerRef.current, { opacity: 0, y: 32, filter: 'blur(6px)' });
      gsap.set(footerRef.current, { opacity: 0, y: 18 });
      gsap.set(productItems, { opacity: 0, y: 45, filter: 'blur(6px)' });

      // ── Real-time Reveal Timeline ───────────────────────────────────
      const revealTl = gsap.timeline({ paused: true });

      revealTl.fromTo(
        headerRef.current,
        { opacity: 0, y: 32, scale: 0.96, filter: 'blur(6px)' },
        { opacity: 1, y: 0, scale: 1.0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' },
        0
      );

      revealTl.fromTo(
        productItems,
        { opacity: 0, y: 45, scale: 0.94, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.85,
          stagger: { amount: 0.6, from: 'center', ease: 'power2.out' },
          ease: 'power3.out',
          onComplete: () => {
            gsap.set(productItems, { clearProps: 'willChange,filter' });
          },
        },
        0.35
      );

      revealTl.fromTo(
        footerRef.current,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(footerRef.current, { clearProps: 'willChange' });
          },
        },
        1.1
      );

      // Store in ref so IntersectionObserver useEffect can trigger it.
      revealTlRef.current = revealTl;
    }, sceneRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // ── IntersectionObserver: trigger reveal when section enters viewport ───
  // Using IntersectionObserver instead of GSAP ScrollTrigger so we don't call
  // ScrollTrigger.refresh() — which would disturb the master timeline scrub
  // and cause earlier cinematic scenes to re-appear (BUG 3 fix).
  useEffect(() => {
    if (!sceneRef.current || prefersReducedMotion) return;

    const el = sceneRef.current;
    let fired = false;

    const sel = gsap.utils.selector(sceneRef);

    // showFallback: snap all content to visible if IntersectionObserver or triggerReveal
    // never fired. Defined first so it can be referenced by the 300ms fallback timer below.
    const showFallback = () => {
      if (fired) return;
      fired = true;
      const productItems = sel('[data-product-item]');
      if (headerRef.current) gsap.set(headerRef.current, { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 });
      if (footerRef.current) gsap.set(footerRef.current, { opacity: 1, y: 0 });
      if (productItems.length) gsap.set(productItems, { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 });
    };

    // ── Fallback: if observer never fires (fast scroll past, nav jump where element is
    // already in viewport on mount), force-reveal after 300ms — not 2500ms.
    // 300ms is enough time for the observer callback to fire naturally;
    // if it hasn't by then we know the section is already visible and we reveal immediately.
    const fallbackTimer = setTimeout(showFallback, 300);

    const triggerReveal = () => {
      if (fired) return;
      fired = true;
      clearTimeout(fallbackTimer);

      // Guard: if the component unmounted after the observer fired but
      // before the callback runs, skip animations to avoid GSAP null-target warnings.
      if (!bgRef.current || !lightRef.current || !curtainRef.current) {
        showFallback();
        return;
      }

      // PRIMARY 1: camera focus-in
      gsap.to(bgRef.current, { scale: 1.0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' });

      // SECONDARY: light bloom
      gsap.to(lightRef.current, { opacity: 0.42, scale: 1.15, duration: 1.0, ease: 'power2.out' });

      // PRIMARY 2: curtain lift.
      // Start revealTl partway through so cards begin appearing BEFORE curtain disappears
      gsap.to(curtainRef.current, {
        opacity: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        onStart: () => {
          revealTlRef.current?.play();
        },
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          triggerReveal();
        }
      },
      // threshold: 0 — fires as soon as ANY pixel of the section enters the viewport.
      // rootMargin was previously '-50px 0px 0px 0px' which required the section to be
      // 50px INSIDE the viewport before firing — on fast scroll this window could be
      // missed entirely, leaving all content permanently at opacity:0.
      { threshold: 0 }
    );

    observer.observe(el);

    // Immediate viewport check: when user nav-clicks to Collection, the section
    // is already in the viewport before this effect runs. The IntersectionObserver
    // fires once on .observe() but there is a micro-task delay before the callback.
    // Check synchronously so nav-click arrivals never see a blank flash.
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) {
      // Tiny rAF delay to let GSAP context finish its setup from useLayoutEffect
      requestAnimationFrame(() => triggerReveal());
    }

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [prefersReducedMotion]);


  return (
    <section
      ref={sceneRef}
      id="collection"
      className="relative w-full z-40"
      style={{ background: '#030703' }}
      aria-label="The Pride of Spices Premium Collection"
    >
      {/* ── BACKGROUND: Forest sunset ambience ── */}
      <div
        ref={bgRef}
        className="absolute inset-0 origin-center will-change-transform pointer-events-none"
      >
        <CinematicImage
          asset={Assets.sunsetBg}
          className="absolute inset-0 w-full h-full"
          style={{ objectPosition: 'center 30%', objectFit: 'cover' }}
        />
      </div>

      {/* Dark atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,10,6,0.72) 0%, rgba(6,10,6,0.52) 45%, rgba(6,10,6,0.82) 100%)',
        }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)' }}
      />

      {/* Ambient warm light bloom */}
      <div
        ref={lightRef}
        className="absolute rounded-full pointer-events-none will-change-transform"
        style={{
          top: '33%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vmin',
          height: '90vmin',
          background:
            'radial-gradient(circle, rgba(201,168,76,0.25) 0%, rgba(212,147,42,0.08) 50%, transparent 75%)',
          filter: 'blur(100px)',
        }}
      />

      {/* ── SECTION HEADER ── */}
      <div
        ref={headerOuterRef}
        style={{
          paddingTop: 'clamp(5rem, 12vh, 10rem)',
          paddingBottom: 'clamp(2.5rem, 5vh, 4rem)',
          paddingLeft: 'clamp(1.5rem, 6vw, 6rem)',
          paddingRight: 'clamp(1.5rem, 6vw, 6rem)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          ref={headerRef}
          className="will-change-transform"
          style={{
            maxWidth: '48rem',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Eyebrow */}
          <p
            className="font-sans uppercase"
            style={{
              fontSize: 'clamp(0.68rem, 1.2vw, 0.78rem)',
              letterSpacing: '0.32em',
              color: 'rgba(212,147,42,0.85)',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            From the Heart of Wayanad
          </p>

          {/* Primary heading */}
          <h2
            className="font-serif text-cream"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              textAlign: 'center',
              textWrap: 'balance',
            }}
          >
            The Collection
          </h2>

          {/* Subtitle */}
          <p
            className="font-sans text-cream/60"
            style={{
              fontSize: 'clamp(0.78rem, 1.5vw, 0.95rem)',
              letterSpacing: '0.06em',
              lineHeight: 1.65,
              marginTop: '1.25rem',
              maxWidth: '36rem',
              textAlign: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Thirteen products. One origin. Centuries of craft.
          </p>

          <span
            className="font-medium text-xs tracking-wider uppercase inline-block"
            style={{
              color: 'rgba(212,147,42,0.85)',
              marginTop: '0.75rem',
              textAlign: 'center',
              letterSpacing: '0.14em',
            }}
          >
            ✦ Click any card to explore origin, tasting notes &amp; reserve allocation
          </span>

          {/* Gold rule divider */}
          <div
            aria-hidden="true"
            style={{
              width: '48px',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(212,147,42,0.55), transparent)',
              margin: '2rem auto 0',
            }}
          />
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div
        style={{
          paddingLeft: 'clamp(1.25rem, 4vw, 4.5rem)',
          paddingRight: 'clamp(1.25rem, 4vw, 4.5rem)',
          paddingBottom: 'clamp(4rem, 8vh, 6rem)',
        }}
      >
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 w-full mx-auto"
          style={{ gap: 'clamp(0.75rem, 1.5vw, 1.25rem)', maxWidth: '1480px' }}
        >
          {PRODUCTS.map((product, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={product.id}
                data-product-item
                className="will-change-transform"
              >
                <div
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    borderRadius: 'clamp(0.75rem, 1.5vw, 1.125rem)',
                    aspectRatio: '4 / 5',
                    transition:
                      'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s ease',
                    transform: isHovered
                      ? 'scale(1.022) translateY(-6px)'
                      : 'scale(1) translateY(0)',
                    boxShadow: isHovered
                      ? '0 28px 64px rgba(0,0,0,0.62), 0 0 0 1.5px rgba(212,147,42,0.48), 0 10px 28px rgba(212,147,42,0.06)'
                      : '0 6px 22px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.04)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Explore ${product.name} — ${product.origin}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProduct(product);
                    }
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transition: 'transform 0.85s cubic-bezier(0.22,0.61,0.36,1)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1.0)',
                    }}
                  >
                    <CinematicImage
                      asset={product.image}
                      className="w-full h-full"
                      style={{ objectPosition: 'center' }}
                    />
                  </div>

                  {/* Gold top-edge shimmer */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      height: '1px',
                      pointerEvents: 'none',
                      background:
                        'linear-gradient(90deg, transparent, rgba(212,147,42,0.72), transparent)',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.45s ease',
                    }}
                  />

                  {/* Bottom gradient */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: isHovered
                        ? 'linear-gradient(to top, rgba(6,10,6,0.94) 0%, rgba(6,10,6,0.22) 48%, transparent 100%)'
                        : 'linear-gradient(to top, rgba(6,10,6,0.85) 0%, rgba(6,10,6,0.12) 42%, transparent 100%)',
                      transition: 'background 0.8s ease',
                    }}
                  />

                  {/* Product info */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: 'clamp(0.875rem, 2.2vw, 1.5rem)',
                      zIndex: 10,
                      pointerEvents: 'none',
                      transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isHovered ? 'translateY(0)' : 'translateY(2px)',
                    }}
                  >
                    <h3
                      className="font-serif text-cream leading-tight drop-shadow-md"
                      style={{
                        fontSize: 'clamp(0.95rem, 2.2vw, 1.45rem)',
                        marginBottom: '0.65rem',
                        textWrap: 'balance',
                      }}
                    >
                      {product.name}
                    </h3>
                    <div
                      className="inline-flex items-center"
                      style={{
                        gap: '6px',
                        fontSize: '0.62rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: isHovered ? '#FDF6EC' : 'rgba(212,147,42,0.92)',
                        background: isHovered ? 'rgba(212,147,42,0.35)' : 'rgba(12,18,12,0.72)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(212,147,42,0.45)',
                        borderRadius: '9999px',
                        padding: '0.3rem 0.85rem',
                        transition: 'all 0.3s ease',
                        boxShadow: isHovered ? '0 4px 12px rgba(212,147,42,0.3)' : 'none',
                      }}
                    >
                      <span>Explore Details</span>
                      <span style={{ transition: 'transform 0.3s ease', transform: isHovered ? 'translateX(3px)' : 'translateX(0)' }}>→</span>
                    </div>
                  </div>

                  {/* Item number badge */}
                  <div
                    aria-hidden="true"
                    className="absolute font-sans"
                    style={{
                      top: 'clamp(0.625rem, 1vw, 0.875rem)',
                      right: 'clamp(0.625rem, 1vw, 0.875rem)',
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      color: 'rgba(212,147,42,0.72)',
                      opacity: isHovered ? 0 : 0.72,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COLLECTION FOOTER ── */}
      <div
        ref={footerRef}
        className="flex flex-col items-center justify-center text-center"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: 'clamp(3.5rem, 7vh, 6rem) clamp(1.5rem, 6vw, 4rem)',
          gap: 'clamp(2rem, 4vh, 3rem)',
        }}
      >
        {/* Prominent Delivery Tagline */}
        <div className="text-center max-w-2xl mx-auto">
          <p
            className="eyebrow"
            style={{ marginBottom: '0.75rem', color: '#D4932A', letterSpacing: '0.35em' }}
          >
            Direct From The Highlands
          </p>
          <h3
            className="font-serif text-cream"
            style={{
              fontSize: 'clamp(1.6rem, 3.8vw, 2.8rem)',
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
              textWrap: 'balance',
            }}
          >
            Natural Wayanadan Spices at Your Doorstep
          </h3>
          <p
            className="font-sans text-cream/55 mt-3"
            style={{ fontSize: 'clamp(0.82rem, 1.5vw, 0.95rem)', letterSpacing: '0.04em' }}
          >
            Freshly harvested, traditional grade spices &amp; pure forest honey delivered directly to your home.
          </p>
        </div>

        {/* Closing editorial quote */}
        <p
          className="font-serif text-cream/45 italic text-center mx-auto"
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.35rem)',
            lineHeight: 1.65,
            maxWidth: '38rem',
            textWrap: 'balance',
          }}
        >
          "From the forests of Wayanad to your table —
          <br />
          <span style={{ color: 'rgba(212,147,42,0.65)' }}>
            uncompromised, unadulterated, unchanged."
          </span>
        </p>

        {/* Heritage stats row */}
        <div
          className="flex flex-wrap items-center justify-center w-full"
          style={{ gap: 'clamp(1.5rem, 5vw, 4rem)' }}
        >
          {[
            { num: '13', label: 'Heritage Products' },
            { num: '1000m+', label: 'Elevation' },
            { num: '3rd Gen', label: 'Farmers' },
            { num: 'Raw', label: 'Unprocessed' },
          ].map(stat => (
            <div
              key={stat.label}
              className="text-center flex flex-col items-center"
              style={{ gap: '0.5rem' }}
            >
              <div
                className="font-serif text-gold leading-none"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2.1rem)' }}
              >
                {stat.num}
              </div>
              <div
                className="font-sans text-cream/35 uppercase"
                style={{ fontSize: 'clamp(0.56rem, 0.9vw, 0.65rem)', letterSpacing: '0.2em' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Contact & Ordering CTAs */}
        <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: '880px' }}>
          <div className="cta-row flex flex-wrap justify-center gap-3.5 w-full">
            <a
              href="mailto:theprideofspices12@gmail.com"
              className="btn-gold"
              style={{ textTransform: 'none', letterSpacing: '0.08em' }}
            >
              Gmail: theprideofspices12@gmail.com
            </a>
            <a
              href="https://wa.me/919645401284"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              WhatsApp: +91 96454 01284
            </a>
            <a href="tel:+919645401284" className="btn-ghost">
              Call: +91 96454 01284
            </a>
          </div>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              scrollToPercent(0);
            }}
            className="font-sans text-cream/40 hover:text-gold text-xs tracking-widest uppercase transition-colors mt-2"
          >
            Return to Top ↑
          </a>
        </div>

        {/* Copyright */}
        <p
          className="font-sans text-cream/20 text-center"
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
          }}
        >
          © {new Date().getFullYear()} Pride of Spices · Wayanad, Kerala, India · theprideofspices12@gmail.com
        </p>
      </div>

      {/* Product Detail Overlay */}
      <ProductOverlay
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
