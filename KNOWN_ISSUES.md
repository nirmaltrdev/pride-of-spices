# Pride of Spices: Known Issues Log

This document tracks all known, blocked, deferred, fixed, and rejected issues in the project.

---

## Open Issues

### Issue 5: Visible Transparency/Checkerboard Artifacts
- **Description:** Some environmental layers or placeholder PNGs show visible edges or checkerboard patterns, breaking the cinematic illusion.
- **Root Cause:** Incomplete layer blending or unoptimized transparency bounds in alpha assets.
- **Affected Files:** `src/scenes/Scene2_Forest/index.tsx`, `src/scenes/Scene3_Discovery/index.tsx`, `src/index.css`
- **Recommended Fix:** Refine CSS blending modes (`mix-blend-mode`), add subtle radial gradients, and implement soft blur edges on layer borders.

### Issue 6: Flat Layered "Stacked" Compositing (Lack of True 3D Depth)
- **Description:** The forest entry looks like flat slides moving horizontally rather than a camera traveling *through* a three-dimensional volume.
- **Root Cause:** Missing Z-axis depth scaling (`translateZ` / `perspective`) and insufficient perspective layering.
- **Affected Files:** `src/scenes/Scene2_Forest/index.tsx`, `src/components/SceneManager.tsx`
- **Recommended Fix:** Wrap scenes in a CSS 3D perspective viewport, apply differential Z-axis translations using GSAP, and increase Z-depth spacing.

### Issue 7: Fade-Based Transitions (Violates Film Script)
- **Description:** Transition between scenes uses simple opacity cross-fades rather than physically motivated transitions (like passing through leaves or clearing fog).
- **Root Cause:** GSAP timelines use `opacity` fades between components rather than Z-axis push-throughs and camera ducking.
- **Affected Files:** All scenes in `src/scenes/`
- **Recommended Fix:** Replace scene opacity fades with leaf sweep sweeps, camera pushes along the Z-axis *through* foreground elements, and mist sweeps.

### Issue 8: Poor Text Readability and Contrast
- **Description:** Text overlays lose legibility when scrolled over bright sunlight spots or complex leaf textures.
- **Root Cause:** Missing text backdrops, low-contrast typography sizing, and absence of text shadows.
- **Affected Files:** `src/scenes/Scene1_Arrival/index.tsx`, `src/scenes/Scene3_Discovery/index.tsx`, `src/scenes/Scene4_Harvest/index.tsx`, `src/scenes/Scene4_5_Honey/index.tsx`
- **Recommended Fix:** Implement rich glassmorphism backdrops (`backdrop-blur`), subtle text drop-shadows, and use high-contrast color tokens.

### Issue 9: Premature Product Showcase
- **Description:** Products appear in the early stages of the walk, reducing the impact of the ecological discovery journey.
- **Root Cause:** Scene5 Collection is loaded too early or is visible before the harvest/processing completes.
- **Affected Files:** `src/scenes/Scene5_Collection/index.tsx`, `src/App.tsx`
- **Recommended Fix:** Restructure the GSAP timeline triggers so the product lineup remains completely hidden until Acts 1-4 are fully traversed.

---

## Blocked Issues
*None.*

## Deferred Issues
*None.*

## Fixed Issues
*(Milestone 1 cleanups logged here)*
- Issue 1: GSAP null Target Warning (Scene 5) (Date Fixed: 2026-07-05)
- Issue 2: GSAP Empty Target Warnings (Audio Controller) (Date Fixed: 2026-07-05)
- Issue 3: Duplicate SceneManager Code Smell (Date Fixed: 2026-07-05)
- Issue 4: StrictMode Sub-Timeline Leak (Date Fixed: 2026-07-05)
