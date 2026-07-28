# Engineering Guidelines

This document establishes the strict engineering constraints required to maintain a performant, production-ready cinematic experience.

## 1. Performance Budgets

Every feature must respect these measurable thresholds:

- **Target FPS:** 60 FPS across modern desktop and mobile browsers.
- **Minimum FPS:** 30 FPS. (If sustained below 30FPS, visual degradation routines must trigger).
- **Maximum Active GSAP Timelines:** 2 primary timelines, 3 secondary timelines simultaneously.
- **Maximum Active ScrollTriggers:** 5 per scene.
- **Maximum Particle Count:** 40 active nodes per scene.
- **CPU Usage:** < 30% average during cinematic scrolling.
- **Memory Growth:** < 50MB increase over a 10-minute session (enforced zero-leak policy).
- **Bundle Size:** Code splitting required for sections outside the initial load path.
- **Maximum Image Size:** 500KB per optimized (WebP/AVIF) full-screen asset.

## 2. Animation & Rendering Rules

- **Hardware Acceleration:** All animations must rely exclusively on `transform` and `opacity`. Animating properties like `top`, `left`, `width`, or `height` is strictly prohibited.
- **Will-Change Management:** Use `will-change` selectively. Turn it on right before an animation begins, and explicitly remove it when the animation completes to prevent VRAM exhaustion (especially on iOS).
- **No Instant 3D Rotations:** Camera and object movements must always use inertia/easing curves.
- **CSS 3D Depth:** Do not rely solely on stacked `translateZ`. Generate organic depth using atmospheric attenuation (fog), parallax scaling, and lighting.

## 3. Accessibility First

The cinematic experience must remain fully usable when visual features are stripped away.

- **Reduced Motion:** Hooks like `useReducedMotion` must disable GSAP timelines and transition to static, accessible layouts.
- **Keyboard Navigation:** Focus management must route users through the logical order of scenes even if they cannot scroll or see the animations.
- **Semantic HTML & Screen Readers:** Use correct landmarks (`<main>`, `<article>`, `<section>`). Hidden text elements must narrate the visual story occurring on screen.

## 4. GSAP & Lenis Integration Rules

- **Double-Scroll Prevention:** Lenis *must* drive GSAP's ticker. Never allow native window scrolling and Lenis to operate simultaneously.
- **Timeline Cleanup:** Every GSAP context or timeline created in a React `useEffect` or `useLayoutEffect` *must* be reverted in the cleanup function to prevent memory leaks and ghost animations during React StrictMode renders.

## 5. Development Diagnostics vs Production Logging

- **Development:** HUD enabled (FPS, Active ScrollTriggers, Memory trends, Lenis status).
- **Production:** No `console.log` statements. HUD disabled. Only fatal error boundaries emit telemetry.
