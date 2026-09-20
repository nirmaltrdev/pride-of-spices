import React, { useState, useRef, useLayoutEffect } from 'react';
import { AssetDefinition } from '@/core/assets/AssetManifest';

interface CinematicImageProps {
  asset: AssetDefinition;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

/**
 * CINEMATIC IMAGE — Version 4 (Responsive Picture & Zero Jank)
 *
 * A smart image wrapper that handles:
 * - Progressive loading with smooth opacity fade
 * - Instant opacity: 1 for already-cached or complete images
 * - Responsive 480w/800w/1200w srcSet negotiation via <picture>
 * - Native AVIF/WebP fallback
 * - Prevention of accidental drag and text selection
 * - Correct object-cover applied to the <img>, not the <picture> wrapper
 */
export function CinematicImage({
  asset,
  className = '',
  style = {},
  onLoad,
  onError,
  sizes = '(max-width: 640px) 480px, (max-width: 1024px) 800px, 1200px',
}: CinematicImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, []);

  const fetchPriority =
    asset.priority === 'critical' ? 'high' : asset.priority === 'low' ? 'low' : 'auto';
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
    <picture
      className={`block overflow-hidden relative ${className}`}
      style={{ background: '#030703', ...style }}
    >
      {/* 1. Responsive Multi-width Sources if defined (480w / 800w / 1200w) */}
      {asset.responsiveSources?.map(src => (
        <source key={src.type} type={src.type} srcSet={src.srcSet} sizes={sizes} />
      ))}

      {/* 2. Fallback single optimized sources */}
      {!asset.responsiveSources && asset.optimizedSources?.avif && (
        <source type="image/avif" srcSet={asset.optimizedSources.avif} sizes={sizes} />
      )}
      {!asset.responsiveSources && asset.optimizedSources?.webp && (
        <source type="image/webp" srcSet={asset.optimizedSources.webp} sizes={sizes} />
      )}

      <img
        ref={imgRef}
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
