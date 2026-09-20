import React, { useState, useCallback } from 'react';
import { ExperienceShell } from './core/shell/ExperienceShell';
import { Scene1_Arrival } from './scenes/Scene1_Arrival';
import { Scene2_Forest } from './scenes/Scene2_Forest';
import { Scene3_Discovery } from './scenes/Scene3_Discovery';
import { Scene4_Harvest } from './scenes/Scene4_Harvest';
import { Scene4_5_Honey } from './scenes/Scene4_5_Honey';
import { Scene5_Collection } from './scenes/Scene5_Collection';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { DebugOverlay } from './components/DebugOverlay';
import { useLenis } from './hooks/useLenis';
import { useRuntimeDiagnostics } from './hooks/useRuntimeDiagnostics';

// Enable debug overlay via ?debug=1 — works on localhost AND Vercel Preview
const IS_DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';


/**
 * THE PRIDE OF SPICES — Version 2
 *
 * Cinematic GSAP scroll-driven documentary experience.
 * Architecture:
 *   - Preloader: critical image preload before experience starts
 *   - ExperienceShell: persistent nav, particles, audio toggle
 *   - SceneManager: 1200vh scroll container + master GSAP timeline
 *   - Scenes 1-5: inject their animations into the master timeline
 */
function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const handlePreloadComplete = useCallback(() => setIsLoaded(true), []);

  // Initialize Lenis for cinematic smooth scrolling (after load)
  useLenis();

  // Active runtime instrumentation for Chrome DevTools
  useRuntimeDiagnostics();

  return (
    <>
      {/* Precision Custom Cursor */}
      <CustomCursor />

      {/* Cinematic preloader — critical image preload */}
      {!isLoaded && <Preloader onComplete={handlePreloadComplete} />}

      {/* The Experience — rendered beneath preloader immediately for fast FCP */}
      <ExperienceShell>
        {/* Scene 1: Arrival — Hero */}
        <Scene1_Arrival />

        {/* Scene 2: The Living Forest — camera enters deep canopy */}
        <Scene2_Forest />

        {/* Scene 3: The Discovery — macro pepper world + monsoon */}
        <Scene3_Discovery />

        {/* Scene 4: The Harvest — artisan craft + drying process */}
        <Scene4_Harvest />

        {/* Scene 4.5: The Honey — amber world + tribal story */}
        <Scene4_5_Honey />
      </ExperienceShell>

      {/* Scene 5: The Collection — lives outside the sticky cinematic scroll,
          in natural page flow so its content is fully scrollable */}
      <Scene5_Collection />

      {/* Live runtime debug overlay — activate via ?debug=1 (works on Vercel Preview too) */}
      {IS_DEBUG && <DebugOverlay />}
    </>
  );

}

export default App;
