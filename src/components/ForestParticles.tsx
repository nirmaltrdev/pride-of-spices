import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * FOREST PARTICLES — Version 4 (Ticker-Synchronized Parallax)
 *
 * Requirements fulfilled:
 * - Synchronized strictly to GSAP ticker (shared RAF loop with ScrollTrigger & Lenis)
 * - Canvas DPR capped at 1.5 to prevent GPU fill-rate throttling on high-DPI retina screens
 * - Clean teardown on unmount or tab visibility switch
 * - 20–30 floating particles with gentle wavering
 */

type ParticleLayer = 'deep' | 'mid' | 'near';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  targetOpacity: number;
  color: string;
  maxLife: number;
  currentLife: number;
  layer: ParticleLayer;
}

const LAYER_CONFIG: Record<
  ParticleLayer,
  {
    count: number;
    speed: number;
    sizeRange: [number, number];
    opacityMax: number;
    colors: string[];
  }
> = {
  deep: {
    count: 6,
    speed: 0.05,
    sizeRange: [3, 5],
    opacityMax: 0.12,
    colors: ['rgba(180,200,140,', 'rgba(200,215,160,', 'rgba(160,190,130,'],
  },
  mid: {
    count: 14,
    speed: 0.16,
    sizeRange: [1, 2.5],
    opacityMax: 0.42,
    colors: ['rgba(212,180,80,', 'rgba(240,230,200,', 'rgba(200,185,120,'],
  },
  near: {
    count: 6,
    speed: 0.32,
    sizeRange: [0.5, 1.5],
    opacityMax: 0.65,
    colors: ['rgba(255,240,200,', 'rgba(245,225,160,', 'rgba(250,235,180,'],
  },
};

function createParticle(
  canvasWidth: number,
  canvasHeight: number,
  layer: ParticleLayer
): Particle {
  const cfg = LAYER_CONFIG[layer];
  const colorBase = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
  const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);

  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -(cfg.speed + Math.random() * cfg.speed * 0.4),
    size,
    opacity: 0,
    targetOpacity: Math.random() * cfg.opacityMax * 0.6 + cfg.opacityMax * 0.4,
    color: colorBase,
    maxLife:
      layer === 'deep'
        ? Math.random() * 480 + 280
        : layer === 'mid'
          ? Math.random() * 300 + 180
          : Math.random() * 200 + 120,
    currentLife: 0,
    layer,
  };
}

export function ForestParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Cap DPR at 1.5 to maintain consistent 60fps on 4K / Retina screens
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let logicalWidth = window.innerWidth;
    let logicalHeight = window.innerHeight;

    const resize = () => {
      logicalWidth = window.innerWidth;
      logicalHeight = window.innerHeight;
      canvas.width = Math.round(logicalWidth * dpr);
      canvas.height = Math.round(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Seed initial particles
    particlesRef.current = [];
    for (const layer of ['deep', 'mid', 'near'] as ParticleLayer[]) {
      const count = LAYER_CONFIG[layer].count;
      for (let i = 0; i < count; i++) {
        const p = createParticle(logicalWidth, logicalHeight, layer);
        p.currentLife = Math.floor(Math.random() * p.maxLife * 0.7);
        particlesRef.current.push(p);
      }
    }

    // GSAP Ticker callback — synchronized with GSAP ScrollTrigger & Lenis RAF
    const tickerUpdate = () => {
      if (document.hidden) return;

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.currentLife++;
        const lifeRatio = p.currentLife / p.maxLife;

        // Fade in/out
        if (lifeRatio < 0.12) {
          p.opacity = p.targetOpacity * (lifeRatio / 0.12);
        } else if (lifeRatio > 0.82) {
          p.opacity = p.targetOpacity * ((1 - lifeRatio) / 0.18);
        } else {
          p.opacity = p.targetOpacity;
        }

        // Movement
        p.x += p.vx;
        p.y += p.vy;

        const waver = p.layer === 'near' ? 0.02 : p.layer === 'mid' ? 0.012 : 0.006;
        p.vx += (Math.random() - 0.5) * waver;
        p.vx *= 0.98;

        // Render
        ctx.beginPath();
        if (p.layer === 'deep' || p.size > 2) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
          grd.addColorStop(0, `${p.color}${Math.min(p.opacity, 1).toFixed(2)})`);
          grd.addColorStop(1, `${p.color}0)`);
          ctx.fillStyle = grd;
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = `${p.color}${Math.min(p.opacity, 1).toFixed(2)})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();

        // Expire
        if (
          p.currentLife >= p.maxLife ||
          p.y < -30 ||
          p.x < -30 ||
          p.x > logicalWidth + 30
        ) {
          particles.splice(i, 1);
        }
      }

      // Replenish
      const layerCounts = { deep: 0, mid: 0, near: 0 };
      for (const p of particles) layerCounts[p.layer]++;

      for (const layer of ['deep', 'mid', 'near'] as ParticleLayer[]) {
        const target = LAYER_CONFIG[layer].count;
        while (layerCounts[layer] < target) {
          const p = createParticle(logicalWidth, logicalHeight, layer);
          particles.push(p);
          layerCounts[layer]++;
        }
      }
    };

    gsap.ticker.add(tickerUpdate);

    return () => {
      gsap.ticker.remove(tickerUpdate);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[8] pointer-events-none"
      aria-hidden="true"
      style={{
        mixBlendMode: 'screen',
      }}
    />
  );
}
