import React, { useState } from 'react';
import { AssetDefinition } from '@/core/assets/AssetManifest';

// NOTE: ScrollTrigger.refresh() is intentionally NOT called on image load.
//
// Calling refresh() on each lazy image load causes a full ScrollTrigger reset:
// the engine seeks every timeline back to position 0 (initial state = opacity:0 /
// visibility:hidden for all scenes), measures layout, then re-scrubs to the current
// scroll position. With 20+ lazy-loaded images on this page, each one loading while
// the user is scrolling caused a visible blank flash across ALL scenes simultaneously.
//
// The Preloader calls ScrollTrigger.refresh() exactly once after all stage-1 assets
// are loaded and the page has settled — that single call is sufficient. All scene
// containers are position:absolute inside a sticky viewport, so lazy images loading
// later do not change the scroll height or bounds that ScrollTrigger needs to track.

interface CinematicImageProps {
  asset: AssetDefinition;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

/**
 * CINEMATIC IMAGE — Version 3 (Production Polish)
 *
 * A smart image wrapper that handles:
 * - Progressive loading with smooth opacity fade
 * - AVIF/WebP format negotiation via <picture>
 * - Graceful error fallback (dark placeholder)
 * - Lazy vs eager loading based on asset priority
 * - Prevention of accidental drag and text selection
 * - Correct object-cover applied to the <img>, not the <picture> wrapper
 */
export function CinematicImage({
  asset,
  className = '',
  style = {},
  onLoad,
  onError,
  sizes = '100vw',
}: CinematicImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchPriority = asset.priority === 'critical' ? 'high' : asset.priority === 'low' ? 'low' : 'auto';
  const loadingAttr = asset.loadingStrategy === 'eager' ? 'eager' : 'lazy';

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    console.warn(`[CinematicImage] Failed to load asset: ${asset.id}`);
    setHasError(true);
    if (onError) onError();
  };

  if (hasError) {
    return (
      <div
        className={`bg-charcoal/40 ${className}`}
        style={style}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  const isDecorative = !asset.altText;

  return (
    /**
     * The <picture> element acts purely as a container. Sizing classes (w-full, h-full)
     * should be on this wrapper. The object-cover/object-position is on the <img> inside.
     * This is the correct semantic structure per MDN spec.
     *
     * background: '#030703' is the dark forest base. This ensures that during image load
     * (opacity: 0 on <img>) and for PNG assets with transparent regions, no browser
     * checkerboard ever shows. Transparent pixels render against this solid dark base.
     */
    <picture
      className={`block overflow-hidden relative ${className}`}
      style={{ background: '#030703', ...style }}
    >
      {asset.optimizedSources?.avif && (
        <source type="image/avif" srcSet={asset.optimizedSources.avif} sizes={sizes} />
      )}
      {asset.optimizedSources?.webp && (
        <source type="image/webp" srcSet={asset.optimizedSources.webp} sizes={sizes} />
      )}
      <img
        src={asset.source}
        alt={asset.altText || ''}
        role={isDecorative ? 'presentation' : undefined}
        aria-hidden={isDecorative ? 'true' : undefined}
        loading={loadingAttr}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        draggable={false}
        className="w-full h-full object-cover select-none pointer-events-none"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        width={asset.width}
        height={asset.height}
      />
    </picture>
  );
}
