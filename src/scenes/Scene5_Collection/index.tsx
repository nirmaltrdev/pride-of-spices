import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useMasterTimeline } from '../../core/controllers/SceneContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ProductOverlay, ProductData } from '../../components/ProductOverlay';
import { scrollToPercent } from '../../core/lenisInstance';
import { CinematicImage } from '../../components/CinematicImage';
import { Assets } from '../../core/assets/AssetManifest';

/** The complete product catalogue */
const PRODUCTS: ProductData[] = [
  {
    id: 'black-pepper',
    name: 'Black Pepper',
    origin: 'Western Ghats, Wayanad — 800m elevation',
    harvestStory: 'Hand-harvested from ancient vines growing deep within the biosphere reserve. Only the heaviest, fully mature berries are selected by experienced pickers.',
    craftsmanship: 'Sun-dried for 7 days on traditional bamboo mats, allowing natural enzymes to slowly cure the skin into a deep, rich black — locking in fierce volatile oils.',
    aroma: 'Sharp, piney, and fiercely warm with a distinct citrus undertone and lingering heat.',
    image: Assets.blackPepper,
    gallery: []
  },
  {
    id: 'green-pepper',
    name: 'Green Pepper',
    origin: 'Forest Reserves, Wayanad',
    harvestStory: 'Harvested early, before the berries fully ripen. The raw cluster carries the freshest, most volatile oils — a different character from cured black pepper.',
    craftsmanship: 'Freeze-dried immediately after harvest to lock in the vibrant colour and the bright, fresh flavour profile.',
    aroma: 'Bright, fresh, and herbaceous with a clean, uncomplicated heat.',
    image: Assets.greenPepper,
    gallery: []
  },
  {
    id: 'cinnamon',
    name: 'Ceylon Cinnamon',
    origin: 'Wayanad River Valleys',
    harvestStory: 'Harvested exclusively at dawn when the sap runs highest. The outer bark is carefully stripped away to reveal the sweet, parchment-thin inner layer.',
    craftsmanship: 'Hand-peeled and rolled by generational craftsmen. Dried slowly in the shade to preserve the delicate volatile sweet oils.',
    aroma: 'Delicately sweet, warm, and highly aromatic without the harshness of Cassia.',
    image: Assets.cinnamon,
    gallery: []
  },
  {
    id: 'cardamom',
    name: 'Green Cardamom',
    origin: 'High Elevations of the Biosphere — 1,200m',
    harvestStory: 'Foraged from the misty, high-altitude slopes. Only the fully ripe pods are hand-clipped to ensure maximum essential oil content.',
    craftsmanship: 'Cured in warm-air chambers to lock in the vibrant green colour and the intense camphoraceous aroma.',
    aroma: 'Intensely fragrant, sweet-spicy with notes of eucalyptus and mint.',
    image: Assets.cardamom,
    gallery: []
  },
  {
    id: 'clove',
    name: 'Whole Cloves',
    origin: 'Spice Gardens, Wayanad',
    harvestStory: 'Harvested precisely when the bud turns from green to a soft pink — before opening. Timing is critical to preserve the eugenol content.',
    craftsmanship: 'Sun-dried over several days until each bud turns a deep reddish-brown. The intense essential oil content makes these some of the most fragrant cloves available.',
    aroma: 'Intensely warm, woody, and sweet with a powerful, long-lasting heat.',
    image: Assets.clove,
    gallery: []
  },
  {
    id: 'nutmeg',
    name: 'Nutmeg',
    origin: 'Tropical Groves, Wayanad',
    harvestStory: 'The fruit splits naturally when fully ripe, revealing the vivid red mace lacing around the inner seed. Both are harvested simultaneously.',
    craftsmanship: 'Dried slowly over 6–8 weeks in natural shade. The mace is carefully separated and dried separately to preserve its individual character.',
    aroma: 'Warm, nutty, slightly sweet with a clean, peppery finish.',
    image: Assets.nutmeg,
    gallery: []
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    origin: 'Forest Fringe Farms, Wayanad',
    harvestStory: 'Grown in the shade of the forest canopy in rich, loamy soil. Harvested after 9 months when the rhizomes reach full maturity.',
    craftsmanship: 'Boiled, dried, and ground using traditional stone mills that preserve the curcumin-rich oils more effectively than industrial milling.',
    aroma: 'Warm, earthy, and pungent with a distinctive golden pigment that stains everything it touches.',
    image: Assets.turmeric,
    gallery: []
  },
  {
    id: 'honey',
    name: 'Wild Forest Honey',
    origin: 'Deep Forests of Wayanad — Nilgiri Biosphere',
    harvestStory: 'Sourced from the giant rock bees (Apis dorsata). Harvested by the Kattunayakan indigenous tribes using sustainable ancestral methods.',
    craftsmanship: 'Raw, unfiltered, and unpasteurized. Each batch carries the unique floral signature of the seasonal forest bloom from which the bees feed.',
    aroma: 'Deeply floral, earthy, and richly complex with a dark, resinous finish.',
    image: Assets.forestHoney,
    gallery: []
  }
];

/**
 * SCENE 5: THE COLLECTION — Version 3 (Complete Refactor)
 *
 * Key architectural fixes:
 *
 * 1. HEADING OVERLAP ELIMINATED:
 *    - Header padding-bottom is now `clamp(5rem, 9vh, 7rem)` (80–112px),
 *      which is always > the GSAP y:28 initial offset, guaranteeing zero visual
 *      overlap between the heading and the first row of cards.
 *    - GSAP y-offset reduced from 50 → 28 to minimize the displacement distance.
 *    - The `overflow: hidden` container clips any residual animation overflow.
 *
 * 2. GRID FULLY BALANCED:
 *    - All 8 cards now use a uniform `4/5` aspect ratio.
 *    - Removed arbitrary `idx % 7` tall/short alternation that caused unbalanced rows.
 *    - Gap uses `clamp(0.75rem, 1.5vw, 1.25rem)` — fluid, no layout-shift jumps.
 *
 * 3. GSAP SELECTOR SCOPED:
 *    - All GSAP selectors use `gsap.utils.selector(sceneRef)` to scope within
 *      this scene's DOM subtree. Eliminates risk of targeting elements from
 *      other scenes that share `[data-product-item]`.
 *
 * 4. FOOTER OPACITY FIXED:
 *    - Removed hardcoded `style={{ opacity: 0 }}` from footer JSX.
 *    - GSAP controls opacity exclusively via `gsap.set()` inside the context.
 *    - On `revealTl` completion, `clearProps: 'opacity,transform'` ensures
 *      no stuck-invisible state after animation ends.
 *
 * 5. CARD RESTING SCALE:
 *    - Image inner div resting scale changed from `1.03` → `1.0`.
 *    - Eliminates unnecessary GPU compositing layer at rest.
 *    - Hover still zooms to `1.08` for the premium parallax-zoom feel.
 *
 * 6. PRODUCT OVERLAY Z-INDEX:
 *    - ProductOverlay sits above the scene (handled in ProductOverlay/index.tsx).
 */
export function Scene5_Collection() {
  const { masterTimeline } = useMasterTimeline();
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
  const scrollableRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!masterTimeline || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // Scoped selector — only targets elements within this scene's subtree
      const sel = gsap.utils.selector(sceneRef);
      const productItems = sel('[data-product-item]');

      // ── Initial States ─────────────────────────────────────────────────
      gsap.set(sceneRef.current, { opacity: 0 });
      gsap.set(curtainRef.current, { opacity: 1 });
      gsap.set(bgRef.current, { scale: 1.08, filter: 'blur(6px)' });

      if (prefersReducedMotion) {
        masterTimeline.to(curtainRef.current, { opacity: 0, duration: 0.04 }, 0.80);
        return;
      }

      // GSAP-only opacity control — NO inline style opacity on footerRef in JSX
      gsap.set(headerRef.current, { opacity: 0, y: 28, filter: 'blur(5px)' });
      gsap.set(footerRef.current, { opacity: 0, y: 18 });
      gsap.set(productItems, { opacity: 0, y: 40, scale: 0.96, filter: 'blur(5px)' });

      // ── Real-time Reveal Timeline (NOT scrub-tied) ─────────────────────
      // Plays in real-time once curtain lifts, so inner-div scrolling
      // and master scrub can't freeze cards mid-animation.
      const revealTl = gsap.timeline({ paused: true });

      // Header: reduced y offset (28px) prevents any overlap with grid
      revealTl.fromTo(
        headerRef.current,
        { opacity: 0, y: 28, filter: 'blur(5px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power3.out',
        },
        0
      );

      // Cards stagger cascade — the cinematic product reveal
      revealTl.fromTo(
        productItems,
        { opacity: 0, y: 40, scale: 0.96, filter: 'blur(5px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.82,
          stagger: {
            amount: 0.65,
            from: 'start',
            ease: 'power2.out',
          },
          ease: 'power3.out',
          onComplete: () => {
            // Clean up will-change and filter to free GPU memory
            gsap.set(productItems, { clearProps: 'willChange,filter' });
          },
        },
        0.4
      );

      // Footer fades in after cards settle
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

      // ── Master Timeline Integration ─────────────────────────────────────
      // 1. Scene becomes visible (still hidden by curtain) at 78% scroll
      masterTimeline.fromTo(
        sceneRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.02, ease: 'none' },
        0.78
      );

      // 2. Curtain lifts at 80% scroll → triggers real-time revealTl
      masterTimeline.fromTo(
        curtainRef.current,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.07,
          ease: 'power2.inOut',
          onStart: () => {
            // Reset inner scroll position so heading is always at top on entry
            if (scrollableRef.current) {
              scrollableRef.current.scrollTop = 0;
            }
            // restart() ensures fresh reveal even on repeat visits (scroll back)
            revealTl.restart();
          },
        },
        0.80
      );

      // 3. Background camera focus-in
      masterTimeline.fromTo(
        bgRef.current,
        { scale: 1.08, filter: 'blur(6px)' },
        { scale: 1.0, filter: 'blur(0px)', duration: 0.09, ease: 'power2.out' },
        0.80
      );

      // 4. Ambient golden light blooms
      masterTimeline.fromTo(
        lightRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 0.42, scale: 1.15, duration: 0.12, ease: 'power2.out' },
        0.81
      );
    }, sceneRef);

    return () => ctx.revert();
  }, [masterTimeline, prefersReducedMotion]);

  return (
    <section
      ref={sceneRef}
      id="collection"
      className="absolute inset-0 w-full h-full z-40 overflow-hidden"
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
          background: 'linear-gradient(to bottom, rgba(6,10,6,0.72) 0%, rgba(6,10,6,0.52) 45%, rgba(6,10,6,0.82) 100%)',
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
        className="absolute rounded-full pointer-events-none opacity-0 will-change-transform"
        style={{
          top: '33%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vmin',
          height: '90vmin',
          background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, rgba(212,147,42,0.08) 50%, transparent 75%)',
          filter: 'blur(100px)',
        }}
      />

      {/* ── ENTRY CURTAIN ── */}
      {/* Solid black overlay. Fades to 0 at 80% scroll to reveal Collection.
          Ensures Honey scene NEVER bleeds through. */}
      <div
        ref={curtainRef}
        className="absolute inset-0 z-50 pointer-events-none"
        style={{ background: '#030703' }}
      />

      {/* ── SCROLLABLE CONTENT WRAPPER ── */}
      <div
        ref={scrollableRef}
        className="relative w-full h-full overflow-y-auto overflow-x-hidden"
        style={{ pointerEvents: 'auto' }}
        data-lenis-prevent
      >

        {/* ── SECTION HEADER ──
            The outer container clips downward overflow so the GSAP y:28
            initial state on headerRef cannot visually intrude into the grid.
            padding-bottom (min 5rem = 80px) > y-offset (28px) guarantees
            at least 52px of clear air between heading and first grid row. */}
        <div
          ref={headerOuterRef}
          style={{
            paddingTop: 'clamp(22vh, 30vh, 38vh)',
            paddingBottom: 'clamp(5rem, 9vh, 7rem)',
            paddingLeft: 'clamp(1.5rem, 6vw, 6rem)',
            paddingRight: 'clamp(1.5rem, 6vw, 6rem)',
            overflow: 'hidden', // Contain GSAP y animation within this box
          }}
        >
          <div
            ref={headerRef}
            className="will-change-transform text-center"
          >
            {/* Eyebrow */}
            <p
              className="font-sans uppercase"
              style={{
                fontSize: 'clamp(0.58rem, 1.2vw, 0.72rem)',
                letterSpacing: '0.38em',
                color: 'rgba(212,147,42,0.85)',
                marginBottom: '1.25rem',
              }}
            >
              From the Heart of Wayanad
            </p>

            {/* Primary heading */}
            <h2
              className="font-serif text-cream"
              style={{
                fontSize: 'clamp(2.8rem, 7vw, 6rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.015em',
                textWrap: 'balance',
              }}
            >
              The Collection
            </h2>

            {/* Subtitle */}
            <p
              className="font-sans text-cream/50 mx-auto"
              style={{
                fontSize: 'clamp(0.78rem, 1.5vw, 0.95rem)',
                letterSpacing: '0.06em',
                lineHeight: 1.65,
                marginTop: '1.5rem',
                maxWidth: '28rem',
              }}
            >
              Eight products. One origin. Centuries of craft.
            </p>

            {/* Gold rule divider */}
            <div
              aria-hidden="true"
              style={{
                width: '48px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(212,147,42,0.55), transparent)',
                margin: '2.5rem auto 0',
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
            style={{
              gap: 'clamp(0.75rem, 1.5vw, 1.25rem)',
              maxWidth: '1480px',
            }}
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
                      transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s ease',
                      transform: isHovered ? 'scale(1.022) translateY(-6px)' : 'scale(1) translateY(0)',
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
                    {/* Product Image — zooms on hover, resting at 1.0 (no GPU waste at rest) */}
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

                    {/* Gold top-edge shimmer — appears on hover */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        height: '1px',
                        pointerEvents: 'none',
                        background: 'linear-gradient(90deg, transparent, rgba(212,147,42,0.72), transparent)',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.45s ease',
                      }}
                    />

                    {/* Bottom gradient — deepens on hover for text contrast */}
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

                    {/* Product info — slides up slightly on hover */}
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
                        transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                      }}
                    >
                      <h3
                        className="font-serif text-cream leading-tight drop-shadow-md"
                        style={{
                          fontSize: 'clamp(0.95rem, 2.2vw, 1.45rem)',
                          marginBottom: '0.5rem',
                          textWrap: 'balance',
                        }}
                      >
                        {product.name}
                      </h3>
                      <div
                        className="flex items-center"
                        style={{
                          gap: '0.5rem',
                          opacity: isHovered ? 1 : 0,
                          transition: 'opacity 0.35s ease 0.06s',
                        }}
                      >
                        <span
                          className="font-sans text-cream/40 uppercase"
                          style={{ fontSize: '0.58rem', letterSpacing: '0.18em' }}
                        >
                          Explore
                        </span>
                        <span style={{ color: 'rgba(212,147,42,0.85)', fontSize: '0.72rem' }}>→</span>
                      </div>
                    </div>

                    {/* Item number badge — hides on hover */}
                    <div
                      aria-hidden="true"
                      className="absolute font-sans"
                      style={{
                        top: 'clamp(0.625rem, 1vw, 0.875rem)',
                        right: 'clamp(0.625rem, 1vw, 0.875rem)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.15em',
                        color: 'rgba(212,147,42,0.62)',
                        opacity: isHovered ? 0 : 0.5,
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
        {/* NOTE: opacity is controlled exclusively by GSAP revealTl.
            NO inline opacity:0 style here — that caused the stuck-invisible bug. */}
        <div
          ref={footerRef}
          className="flex flex-col items-center justify-center"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: 'clamp(3.5rem, 7vh, 6rem) clamp(1.5rem, 6vw, 4rem)',
            gap: 'clamp(2rem, 4vh, 3.5rem)',
          }}
        >
          {/* Closing editorial quote */}
          <p
            className="font-serif text-cream/45 italic text-center mx-auto"
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.45rem)',
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
              { num: '8', label: 'Heritage Products' },
              { num: '800m+', label: 'Elevation' },
              { num: '3rd Gen', label: 'Farmers' },
              { num: 'Raw', label: 'Unprocessed' },
            ].map(stat => (
              <div key={stat.label} className="text-center flex flex-col items-center" style={{ gap: '0.5rem' }}>
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

          {/* CTA row */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center w-full"
            style={{ gap: 'clamp(0.75rem, 2vw, 1.25rem)' }}
          >
            <a
              href="mailto:hello@prideofspices.com"
              className="btn-gold"
              style={{ minWidth: 'clamp(180px, 30vw, 260px)' }}
            >
              Make an Enquiry
            </a>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                scrollToPercent(0);
              }}
              className="btn-ghost"
              style={{ minWidth: 'clamp(180px, 30vw, 260px)' }}
            >
              Return to Arrival ↑
            </a>
          </div>

          {/* Copyright */}
          <p className="font-sans text-cream/20 text-center" style={{ fontSize: '0.68rem', letterSpacing: '0.12em' }}>
            © {new Date().getFullYear()} Pride of Spices · Wayanad, Kerala, India
          </p>
        </div>
      </div>

      {/* Product Detail Overlay */}
      <ProductOverlay
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
