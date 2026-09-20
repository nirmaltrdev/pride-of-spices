import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * FOREST PARTICLES — Version 3 (Layered Depth)
 *
 * Canvas-based floating particle system with 3 distinct depth layers
 * that move at different speeds to create volumetric, cinematic depth:
 *
 * Layer 1 (DEEP / SLOW): Large, semi-transparent spores — furthest from camera
 * Layer 2 (MID): Medium dust motes — primary ambient layer
 * Layer 3 (NEAR / FAST): Tiny bright pollen specks — closest to camera
 *
 * Rules (per animation budget):
 * - 20–40 particles active at any time across all layers
 * - Hardware accelerated via Canvas 2D (avoids DOM layout/repaint)
 * - Automatically pauses when tab is hidden (Page Visibility API)
 * - Respects prefers-reduced-motion
 * - will-change: contents on the canvas element for GPU compositing
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

// Layer configuration — different speeds create parallax depth illusion
const LAYER_CONFIG: Record<ParticleLayer, {
  count: number;
  speed: number;   // vertical drift multiplier
  sizeRange: [number, number];
  opacityMax: number;
  colors: string[];
}> = {
  deep: {
    count: 8,
    speed: 0.06,   // slowest — furthest
    sizeRange: [3, 6],
    opacityMax: 0.12,
    colors: ['rgba(180,200,140,', 'rgba(200,215,160,', 'rgba(160,190,130,'],
  },
  mid: {
    count: 16,
    speed: 0.18,   // mid-speed
    sizeRange: [1, 3],
    opacityMax: 0.45,
    colors: ['rgba(212,180,80,', 'rgba(240,230,200,', 'rgba(200,185,120,'],
  },
  near: {
    count: 8,
    speed: 0.38,   // fastest — nearest to camera
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
    vy: -(cfg.speed + Math.random() * cfg.speed * 0.5), // upward drift at layer speed
    size,
    opacity: 0,
    targetOpacity: Math.random() * cfg.opacityMax * 0.6 + cfg.opacityMax * 0.4,
    color: colorBase,
    maxLife: layer === 'deep'
      ? Math.random() * 480 + 280   // deep = very long life
      : layer === 'mid'
      ? Math.random() * 300 + 180   // mid = medium life
      : Math.random() * 200 + 120,  // near = short, quick life
    currentLife: 0,
    layer,
  };
}


export function ForestParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isVisibleRef.current) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.currentLife++;
      const lifeRatio = p.currentLife / p.maxLife;

      // Smooth fade in (first 12%) and fade out (last 18%)
      if (lifeRatio < 0.12) {
        p.opacity = p.targetOpacity * (lifeRatio / 0.12);
      } else if (lifeRatio > 0.82) {
        p.opacity = p.targetOpacity * ((1 - lifeRatio) / 0.18);
      } else {
        p.opacity = p.targetOpacity;
      }

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Gentle horizontal waver — more pronounced for near layer
      const waverAmount = p.layer === 'near' ? 0.025 : p.layer === 'mid' ? 0.015 : 0.008;
      p.vx += (Math.random() - 0.5) * waverAmount;
      p.vx *= 0.97; // damping

      // Draw
      ctx.beginPath();
      if (p.layer === 'deep' || p.size > 2) {
        // Soft radial glow for larger/deeper particles
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grd.addColorStop(0, `${p.color}${Math.min(p.opacity, 1).toFixed(2)})`);
        grd.addColorStop(1, `${p.color}0)`);
        ctx.fillStyle = grd;
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      } else {
        // Simple crisp dot for near/tiny particles
        ctx.fillStyle = `${p.color}${Math.min(p.opacity, 1).toFixed(2)})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Remove dead or out-of-bounds particles
      if (
        p.currentLife >= p.maxLife ||
        p.y < -40 ||
        p.x < -40 ||
        p.x > canvas.width + 40
      ) {
        particles.splice(i, 1);
      }
    }

    // Spawn new particles per layer to maintain target counts
    const layerCounts = { deep: 0, mid: 0, near: 0 };
    for (const p of particles) layerCounts[p.layer]++;

    for (const layer of ['deep', 'mid', 'near'] as ParticleLayer[]) {
      const target = LAYER_CONFIG[layer].count;
      while (layerCounts[layer] < target) {
        const p = createParticle(canvas.width, canvas.height, layer);
        particles.push(p);
        layerCounts[layer]++;
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Seed initial particles spread across all life stages
    for (const layer of ['deep', 'mid', 'near'] as ParticleLayer[]) {
      const count = LAYER_CONFIG[layer].count;
      for (let i = 0; i < count; i++) {
        const p = createParticle(canvas.width, canvas.height, layer);
        // Stagger initial life so they don't all appear simultaneously
        p.currentLife = Math.floor(Math.random() * p.maxLife * 0.6);
        particlesRef.current.push(p);
      }
    }

    // Pause when tab is hidden to save GPU resources
    const onVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [prefersReducedMotion, tick]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[8] pointer-events-none"
      aria-hidden="true"
      style={{
        mixBlendMode: 'screen',
        willChange: 'contents',
      }}
    />
  );
}
