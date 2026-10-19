import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { pauseLenis, resumeLenis } from '../../core/lenisInstance';
import { AssetDefinition } from '../../core/assets/AssetManifest';
import { CinematicImage } from '../CinematicImage';

export interface ProductData {
  id: string;
  name: string;
  origin: string;
  craftsmanship: string;
  harvestStory: string;
  aroma: string;
  image: AssetDefinition;
  gallery: string[];
}

interface ProductOverlayProps {
  product: ProductData | null;
  onClose: () => void;
}

/**
 * PRODUCT OVERLAY — Version 3 (Production Polish)
 *
 * Key improvements over v2:
 *
 * 1. Z-INDEX FIXED: Raised from z-[50] → z-[200], ensuring it always renders
 *    above the Collection curtain (z-50) and CinematicNav (z-[100]).
 *
 * 2. MOBILE IMAGE PANEL: On mobile (< md), a compact image strip appears at
 *    the top of the content panel so users see the product photo on all devices.
 *
 * 3. FLUID PADDING: Replaced fixed `p-8 md:p-12 lg:p-16` with
 *    `clamp(1.75rem, 4vw, 4rem)` for smooth, breakpoint-free padding.
 *
 * 4. FORM FOCUS STATES: Input focus now shows a gold underline glow via
 *    box-shadow instead of just a borderBottom color change.
 *
 * 5. TEXT BALANCE: Product name heading uses text-wrap:balance.
 *
 * 6. TOUCH TARGET: All interactive buttons have min-height:44px.
 */
export function ProductOverlay({ product, onClose }: ProductOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    country: '',
    quantity: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; country?: string }>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  useEffect(() => {
    let ctx: gsap.Context | null = null;

    if (product && overlayRef.current && contentRef.current) {
      setShowInquiry(false);
      setSubmitted(false);
      setFormState({ name: '', email: '', country: '', quantity: '', message: '' });
      setFormErrors({});

      // Guarantees visibility is active by default
      if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 1 });
      if (contentRef.current) gsap.set(contentRef.current, { x: '0%', opacity: 1 });
      if (imageRef.current) gsap.set(imageRef.current, { scale: 1, opacity: 1 });

      ctx = gsap.context(() => {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo(
          contentRef.current,
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
        if (imageRef.current) {
          gsap.fromTo(
            imageRef.current,
            { scale: 1.1, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }
          );
        }
      }, overlayRef);

      pauseLenis();
      setTimeout(() => closeBtnRef.current?.focus(), 400);

      return () => {
        resumeLenis();
        if (ctx) ctx.revert();
      };
    } else {
      setShowInquiry(false);
    }
  }, [product]);

  const handleClose = useCallback(() => {
    if (!overlayRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        resumeLenis();
        onClose();
      },
    });
    tl.to(contentRef.current, { x: '8%', opacity: 0, duration: 0.38, ease: 'power2.in' })
      .to(imageRef.current, { opacity: 0, scale: 1.05, duration: 0.38, ease: 'power2.in' }, '<')
      .to(overlayRef.current, { opacity: 0, duration: 0.52, ease: 'power2.inOut' }, '-=0.18');
  }, [onClose]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, handleClose]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validate all required fields
    const errors: { name?: string; email?: string; country?: string } = {};
    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedCountry = formState.country.trim();

    if (!trimmedName) {
      errors.name = 'Please enter your full name.';
    }
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = 'Please enter a valid email (e.g. name@domain.com).';
    }
    if (!trimmedCountry) {
      errors.country = 'Please enter your country.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.name) document.getElementById('inquiry-name')?.focus();
      else if (errors.email) document.getElementById('inquiry-email')?.focus();
      else if (errors.country) document.getElementById('inquiry-country')?.focus();
      return;
    }

    setFormErrors({});
    const subject = encodeURIComponent(
      'Order / Allocation Request: ' + product.name + ' - ' + trimmedName
    );
    const body = encodeURIComponent(
      'Product: ' +
        product.name +
        '\nName: ' +
        trimmedName +
        '\nEmail: ' +
        trimmedEmail +
        '\nCountry: ' +
        trimmedCountry +
        '\nEstimated Quantity: ' +
        (formState.quantity.trim() || 'Standard') +
        '\n\nMessage / Notes:\n' +
        (formState.message.trim() || 'I would like to inquire about ordering this spice.')
    );
    window.location.href =
      'mailto:theprideofspices12@gmail.com?subject=' + subject + '&body=' + body;
    setSubmitted(true);
  };

  if (!product) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    color: '#F2F9F5',
    padding: '0.625rem 0',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)',
    borderBottom: '1px solid rgba(214, 217, 224, 0.3)',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  };

  const inputFocusStyle = {
    borderBottomColor: '#36C12B',
    boxShadow: '0 2px 0 rgba(54, 193, 43, 0.45)',
  };

  const inputBlurStyle = {
    borderBottomColor: 'rgba(214, 217, 224, 0.3)',
    boxShadow: 'none',
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 flex pointer-events-auto"
      /* z-index: 100000 ensures overlay renders ON TOP of CinematicNav and root shell */
      style={{ zIndex: 100000, background: 'rgba(6,10,6,0.96)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-product-name"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      {/* ── Desktop Left: Photography panel ── */}
      <div
        ref={imageRef}
        className="hidden md:flex items-center justify-center absolute left-0 top-0 bottom-0 w-[48%] opacity-0 will-change-transform overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16,24,16,0.85) 0%, rgba(6,10,6,0.98) 100%)',
        }}
        aria-hidden="true"
      >
        <CinematicImage
          asset={product.image}
          className="w-full h-full"
          objectFit="contain"
          objectPosition="center"
          style={{ background: 'transparent' }}
          imgStyle={{ maxHeight: '92vh', maxWidth: '92%', margin: 'auto' }}
        />
        {/* Edge vignette for seamless blend */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 75%, rgba(6,10,6,0.96) 100%), linear-gradient(to top, rgba(6,10,6,0.4) 0%, transparent 20%), linear-gradient(to bottom, rgba(6,10,6,0.4) 0%, transparent 20%)',
          }}
        />
      </div>

      {/* ── Content Panel: The Estate Journal ── */}
      <div
        ref={contentRef}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full md:w-[52%] overflow-y-auto"
        style={{
          background: 'rgba(8,13,8,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Sticky Top Navigation Bar */}
        <div
          className="sticky top-0 flex items-center justify-between"
          style={{
            zIndex: 50,
            padding: '1.125rem clamp(1.75rem, 4vw, 4rem)',
            background: 'rgba(8,13,8,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 'max(1.125rem, calc(0.875rem + env(safe-area-inset-top, 0px)))',
          }}
        >
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            className="inline-flex items-center gap-2.5 group cursor-pointer transition-colors duration-200"
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              color: '#36C12B',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#F2F9F5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#36C12B';
            }}
            aria-label="Back to Collection Grid"
          >
            <span
              className="inline-block transition-transform duration-200 ease-out group-hover:-translate-x-1"
              style={{
                fontSize: '14px',
                lineHeight: 1,
                fontWeight: 500,
                display: 'inline-block',
              }}
              aria-hidden="true"
            >
              ←
            </span>
            <span
              className="font-sans uppercase"
              style={{
                fontSize: '14px',
                letterSpacing: '0.22em',
                fontWeight: 500,
              }}
            >
              Back to Collection Grid
            </span>
          </button>
        </div>

        {/* Secondary Back Navigation: Positioned ABOVE the product image */}
        {showInquiry && !submitted && (
          <div
            className="flex items-center justify-between"
            style={{
              padding: '0.75rem clamp(1.75rem, 4vw, 4rem)',
              background: 'rgba(18, 22, 20, 0.96)',
              borderBottom: '1px solid rgba(214, 217, 224, 0.1)',
            }}
          >
            <button
              onClick={() => setShowInquiry(false)}
              className="inline-flex items-center gap-2 group cursor-pointer transition-colors duration-200"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.25rem 0',
                color: '#D6D9E0',
                outline: 'none',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#36C12B';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#D6D9E0';
              }}
              aria-label="Go back to product details"
            >
              <span
                className="inline-block transition-transform duration-200 ease-out group-hover:-translate-x-1"
                style={{ fontSize: '14px', lineHeight: 1, fontWeight: 500 }}
                aria-hidden="true"
              >
                ←
              </span>
              <span
                className="font-sans uppercase font-medium"
                style={{ fontSize: '13px', letterSpacing: '0.2em' }}
              >
                Back
              </span>
            </button>
            <span
              className="font-sans uppercase text-xs hidden sm:inline-block"
              style={{ color: '#D6D9E0', letterSpacing: '0.18em', opacity: 0.7 }}
            >
              Reserve Allocation
            </span>
          </div>
        )}

        {/* Mobile image presentation — visible only on mobile (hidden md:block) */}
        <div
          className="block md:hidden relative w-full flex items-center justify-center"
          style={{
            height: 'clamp(240px, 60vw, 380px)',
            background:
              'radial-gradient(ellipse at center, rgba(16,24,16,0.85) 0%, rgba(8,13,8,0.98) 100%)',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <CinematicImage
            asset={product.image}
            className="w-full h-full"
            objectFit="contain"
            objectPosition="center"
            style={{ background: 'transparent' }}
            imgStyle={{ maxHeight: '100%', maxWidth: '100%', margin: '0 auto' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 70%, rgba(8,13,8,0.98) 100%)',
            }}
          />
        </div>

        {!showInquiry ? (
          <div
            style={{
              padding: 'clamp(1.75rem, 4vw, 4rem)',
              maxWidth: '580px',
              paddingTop: 'clamp(1.5rem, 3vh, 2.5rem)',
            }}
          >
            {/* Journal header */}
            <div style={{ marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)' }}>
              <p
                className="font-sans uppercase"
                style={{
                  fontSize: 'clamp(0.68rem, 1.1vw, 0.78rem)',
                  letterSpacing: '0.36em',
                  color: 'rgba(212,147,42,0.8)',
                  marginBottom: '0.75rem',
                }}
              >
                The Estate Journal
              </p>
              <h2
                id="overlay-product-name"
                className="font-serif text-cream"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.015em',
                  textWrap: 'balance',
                }}
              >
                {product.name}
              </h2>
              <p
                className="font-sans text-cream/40 tracking-wider"
                style={{ fontSize: 'clamp(0.68rem, 1.2vw, 0.8rem)', marginTop: '0.75rem' }}
              >
                {product.origin}
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                width: '40px',
                height: '1px',
                background: 'rgba(212,147,42,0.4)',
                marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(1.5rem, 3vh, 2.5rem)',
              }}
            >
              {/* Origin */}
              <section>
                <h3
                  className="font-sans uppercase"
                  style={{
                    fontSize: 'clamp(0.68rem, 1.1vw, 0.78rem)',
                    letterSpacing: '0.28em',
                    color: 'rgba(212,147,42,0.75)',
                    marginBottom: '0.875rem',
                  }}
                >
                  Origin
                </h3>
                <p
                  className="font-serif text-cream/82 leading-relaxed"
                  style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}
                >
                  {product.origin}
                </p>
              </section>

              {/* Craftsmanship & Harvest */}
              <section>
                <h3
                  className="font-sans uppercase"
                  style={{
                    fontSize: 'clamp(0.58rem, 1.1vw, 0.68rem)',
                    letterSpacing: '0.32em',
                    color: 'rgba(212,147,42,0.75)',
                    marginBottom: '0.875rem',
                  }}
                >
                  Craftsmanship &amp; Harvest
                </h3>
                <p
                  className="font-sans text-cream/65 leading-relaxed"
                  style={{ fontSize: 'clamp(0.82rem, 1.5vw, 0.95rem)', marginBottom: '0.875rem' }}
                >
                  {product.harvestStory}
                </p>
                <p
                  className="font-sans text-cream/65 leading-relaxed"
                  style={{ fontSize: 'clamp(0.82rem, 1.5vw, 0.95rem)' }}
                >
                  {product.craftsmanship}
                </p>
              </section>

              {/* Aroma & Flavour */}
              <section>
                <h3
                  className="font-sans uppercase"
                  style={{
                    fontSize: 'clamp(0.58rem, 1.1vw, 0.68rem)',
                    letterSpacing: '0.32em',
                    color: 'rgba(212,147,42,0.75)',
                    marginBottom: '0.875rem',
                  }}
                >
                  Aroma &amp; Flavour Notes
                </h3>
                <p
                  className="font-serif italic text-cream/78 leading-relaxed"
                  style={{
                    fontSize: 'clamp(0.95rem, 1.8vw, 1.12rem)',
                    borderLeft: '2px solid rgba(212,147,42,0.3)',
                    paddingLeft: '1rem',
                  }}
                >
                  {product.aroma}
                </p>
              </section>

              {/* Gallery if available */}
              {product.gallery.length > 0 && (
                <section>
                  <h3
                    className="font-sans uppercase"
                    style={{
                      fontSize: 'clamp(0.58rem, 1.1vw, 0.68rem)',
                      letterSpacing: '0.32em',
                      color: 'rgba(212,147,42,0.75)',
                      marginBottom: '0.875rem',
                    }}
                  >
                    From the Estate
                  </h3>
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                    {product.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '80px',
                          height: '80px',
                          backgroundImage: `url('${img}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '4px',
                          opacity: 0.82,
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div
                style={{
                  paddingTop: 'clamp(1rem, 2.5vh, 1.5rem)',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p
                  className="font-sans text-cream/35 leading-relaxed"
                  style={{ fontSize: 'clamp(0.72rem, 1.3vw, 0.82rem)', marginBottom: '1.25rem' }}
                >
                  Available in bulk quantities for exporters, wholesalers, and premium retailers.
                </p>
                <div className="flex flex-col gap-3">
                  <a
                    href={`https://wa.me/919645401284?text=${encodeURIComponent(`Hello, I am interested in inquiring about ${product.name} from Pride of Spices.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                    aria-label={`WhatsApp Inquiry for ${product.name}`}
                  >
                    WhatsApp Inquiry for {product.name}
                  </a>
                  <a
                    href={`mailto:theprideofspices12@gmail.com?subject=${encodeURIComponent(`Product Inquiry: ${product.name}`)}&body=${encodeURIComponent(`Hello, I would like to order / inquire about ${product.name}. Please share pricing and shipping details.`)}`}
                    className="btn-ghost w-full"
                    style={{
                      justifyContent: 'center',
                      textAlign: 'center',
                      textTransform: 'none',
                      letterSpacing: '0.04em',
                      whiteSpace: 'normal',
                      wordBreak: 'break-all',
                      color: '#D6D9E0',
                      borderColor: 'rgba(214, 217, 224, 0.22)',
                      minHeight: '44px',
                    }}
                  >
                    Gmail: theprideofspices12@gmail.com
                  </a>
                  <a
                    href="tel:+919645401284"
                    className="btn-ghost w-full"
                    style={{
                      justifyContent: 'center',
                      textAlign: 'center',
                      color: '#D6D9E0',
                      borderColor: 'rgba(214, 217, 224, 0.22)',
                      minHeight: '44px',
                    }}
                  >
                    Call: +91 96454 01284
                  </a>
                  <button
                    onClick={() => setShowInquiry(true)}
                    className="btn-ghost w-full"
                    style={{
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      letterSpacing: '0.14em',
                      color: '#D6D9E0',
                      borderColor: 'rgba(214, 217, 224, 0.16)',
                      minHeight: '44px',
                    }}
                  >
                    Or fill out web form
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'clamp(1.75rem, 4vw, 4rem)', maxWidth: '580px' }}>
            {submitted ? (
              /* ── Success State ── */
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{ minHeight: '60vh', padding: '4rem 0' }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '1px solid #36C12B',
                    background: 'rgba(1, 128, 57, 0.15)',
                    marginBottom: '2rem',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4 10l4 4 8-8"
                      stroke="#36C12B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  className="font-serif text-cream"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1rem' }}
                >
                  Email Draft Prepared
                </h2>
                <p
                  className="font-sans text-cream/85 leading-relaxed"
                  style={{ fontSize: 'clamp(0.85rem, 1.5vw, 0.98rem)', maxWidth: '380px' }}
                >
                  Your reservation request for {product.name} has been formatted and opened in your
                  email client addressed to{' '}
                  <span className="font-semibold text-brand-secondary" style={{ color: '#36C12B' }}>
                    theprideofspices12@gmail.com
                  </span>
                  .
                </p>
                <p
                  className="font-sans text-xs mt-3 leading-relaxed"
                  style={{ maxWidth: '360px', color: '#D6D9E0', opacity: 0.8 }}
                >
                  Please press send in your email app, or reach out directly on WhatsApp for instant
                  confirmation.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
                  <a
                    href={`https://wa.me/919645401284?text=${encodeURIComponent(`Hello, I have submitted an allocation request for ${product.name} and would like to confirm my order.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    Confirm via WhatsApp
                  </a>
                  <button
                    onClick={handleClose}
                    className="btn-ghost font-sans uppercase"
                    style={{
                      minHeight: '44px',
                      color: '#D6D9E0',
                    }}
                  >
                    ← Back to Collection
                  </button>
                </div>
              </div>
            ) : (
              /* ── Inquiry Form ── */
              <>
                <h2
                  className="font-serif text-cream"
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    textWrap: 'balance',
                    marginBottom: '0.5rem',
                  }}
                >
                  Request {product.name}
                </h2>
                <p
                  className="font-sans leading-relaxed"
                  style={{
                    fontSize: 'clamp(0.8rem, 1.5vw, 0.92rem)',
                    color: '#D6D9E0',
                    marginBottom: 'clamp(1.75rem, 4vh, 2.5rem)',
                    opacity: 0.85,
                  }}
                >
                  Reserve allocation from our upcoming estate harvest.
                </p>

                <form
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(1.25rem, 3vh, 2rem)',
                  }}
                  onSubmit={handleFormSubmit}
                  noValidate
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="inquiry-name"
                        className="block font-sans uppercase font-medium"
                        style={{
                          fontSize: '0.72rem',
                          letterSpacing: '0.18em',
                          marginBottom: '0.5rem',
                          color: '#D6D9E0',
                        }}
                      >
                        Name{' '}
                        <span style={{ color: '#36C12B', marginLeft: '0.2rem' }} aria-hidden="true">
                          *
                        </span>
                      </label>
                      <input
                        id="inquiry-name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Your full name"
                        value={formState.name}
                        onChange={(e) => {
                          setFormState((s) => ({ ...s, name: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputBlurStyle)
                        }
                      />
                      {formErrors.name && (
                        <p
                          role="alert"
                          className="font-sans"
                          style={{
                            fontSize: '0.72rem',
                            color: '#FF6B6B',
                            marginTop: '0.35rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="inquiry-email"
                        className="block font-sans uppercase font-medium"
                        style={{
                          fontSize: '0.72rem',
                          letterSpacing: '0.18em',
                          marginBottom: '0.5rem',
                          color: '#D6D9E0',
                        }}
                      >
                        Email{' '}
                        <span style={{ color: '#36C12B', marginLeft: '0.2rem' }} aria-hidden="true">
                          *
                        </span>
                      </label>
                      <input
                        id="inquiry-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="name@company.com"
                        value={formState.email}
                        onChange={(e) => {
                          setFormState((s) => ({ ...s, email: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputBlurStyle)
                        }
                      />
                      {formErrors.email && (
                        <p
                          role="alert"
                          className="font-sans"
                          style={{
                            fontSize: '0.72rem',
                            color: '#FF6B6B',
                            marginTop: '0.35rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    <div>
                      <label
                        htmlFor="inquiry-country"
                        className="block font-sans uppercase font-medium"
                        style={{
                          fontSize: '0.72rem',
                          letterSpacing: '0.18em',
                          marginBottom: '0.5rem',
                          color: '#D6D9E0',
                        }}
                      >
                        Country{' '}
                        <span style={{ color: '#36C12B', marginLeft: '0.2rem' }} aria-hidden="true">
                          *
                        </span>
                      </label>
                      <input
                        id="inquiry-country"
                        type="text"
                        required
                        autoComplete="country-name"
                        placeholder="e.g. United Arab Emirates, India, UK"
                        value={formState.country}
                        onChange={(e) => {
                          setFormState((s) => ({ ...s, country: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, country: undefined }));
                        }}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputBlurStyle)
                        }
                      />
                      {formErrors.country && (
                        <p
                          role="alert"
                          className="font-sans"
                          style={{
                            fontSize: '0.72rem',
                            color: '#FF6B6B',
                            marginTop: '0.35rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {formErrors.country}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="inquiry-quantity"
                        className="block font-sans uppercase font-medium"
                        style={{
                          fontSize: '0.72rem',
                          letterSpacing: '0.18em',
                          marginBottom: '0.5rem',
                          color: '#D6D9E0',
                        }}
                      >
                        Quantity (Approx)
                      </label>
                      <input
                        id="inquiry-quantity"
                        type="text"
                        placeholder="e.g. 5kg, 50 bottles, bulk export"
                        value={formState.quantity}
                        onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                        style={inputStyle}
                        onFocus={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputFocusStyle)
                        }
                        onBlur={(e) =>
                          Object.assign((e.currentTarget as HTMLElement).style, inputBlurStyle)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-message"
                      className="block font-sans uppercase font-medium"
                      style={{
                        fontSize: '0.72rem',
                        letterSpacing: '0.18em',
                        marginBottom: '0.5rem',
                        color: '#D6D9E0',
                      }}
                    >
                      Message (Optional)
                    </label>
                    <textarea
                      id="inquiry-message"
                      rows={4}
                      placeholder="Special requirements, packaging, delivery destination..."
                      value={formState.message}
                      onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.65 }}
                      onFocus={(e) =>
                        Object.assign((e.currentTarget as HTMLElement).style, inputFocusStyle)
                      }
                      onBlur={(e) =>
                        Object.assign((e.currentTarget as HTMLElement).style, inputBlurStyle)
                      }
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.875rem', paddingTop: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn-whatsapp"
                      style={{ flex: 1, minHeight: '48px' }}
                    >
                      Submit Inquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInquiry(false)}
                      className="btn-ghost"
                      style={{ padding: '0.75rem 1.75rem', minHeight: '48px', color: '#D6D9E0' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
