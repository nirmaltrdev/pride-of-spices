import React from 'react';
import { SceneManager } from '../controllers/SceneManager';
import { EnvironmentController } from '../controllers/EnvironmentController';
import { AudioController } from '../controllers/AudioController';
import { CinematicNav } from '../../components/CinematicNav';
import { ForestParticles } from '../../components/ForestParticles';

/**
 * THE EXPERIENCE SHELL — Version 2 (Production Polish)
 *
 * Root component of the cinematic documentary experience.
 * - 1200vh scroll height gives generous, unhurried cinematic pacing
 * - CinematicNav hovers above all scenes, appears after first act
 * - EnvironmentController manages the persistent atmospheric canvas
 * - AudioController: non-blocking sound toggle (appears after first scroll)
 * - ForestParticles: canvas-based atmospheric particle system
 * - Skip-to-content link for keyboard accessibility
 */
export function ExperienceShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="experience-shell font-sans bg-charcoal text-cream antialiased"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Skip to content — accessibility */}
      <a
        href="#collection"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1000] focus:px-4 focus:py-2 focus:bg-gold focus:text-charcoal focus:font-sans focus:text-sm focus:tracking-wide focus:rounded"
      >
        Skip to Collection
      </a>

      {/* Premium Cinematic Navigation */}
      <CinematicNav />

      {/* Atmospheric Particle System */}
      <ForestParticles />

      {/* Ambient Sound Toggle */}
      <AudioController />

      {/* Master Scroll Container */}
      <SceneManager scrollHeight="800vh">
        <EnvironmentController />
        {children}
      </SceneManager>
    </main>
  );
}
