# Pride of Spices: Development Log

This log tracks the progress of the continuous cinematic single-take web experience milestones.

---

## [Milestone 1] - 2026-07-05
- **Objective:** Establish Unified Camera Controller, consolidate Lenis smooth scrolling, and dynamic scrollHeight support.
- **Files Modified:**
  - `src/App.tsx`
  - `src/components/SceneManager.tsx`
  - `src/core/controllers/AudioController.tsx`
  - `src/core/controllers/EnvironmentController.tsx`
  - `src/scenes/Scene1_Arrival/index.tsx`
  - `src/scenes/Scene2_Forest/index.tsx`
  - `src/scenes/Scene3_Discovery/index.tsx`
  - `src/scenes/Scene4_Harvest/index.tsx`
  - `src/scenes/Scene4_5_Honey/index.tsx`
  - `src/scenes/Scene5_Collection/index.tsx`
- **New Components Created:** None.
- **Bugs Fixed:** 
  - Fixed duplicate Lenis scroll managers running simultaneously.
  - Fixed `SceneManager` ignoring the `scrollHeight` prop.
  - Fixed GSAP `target null not found` warning caused by unbound `cloveRef` in `Scene5_Collection`.
  - Fixed GSAP `target  not found` warnings caused by direct React Ref target animating in `AudioController`.
  - Prevented timeline leaks and duplicate animations inside `masterTimeline` upon React StrictMode double mounts.
  - Deprecated the duplicate `src/components/SceneManager.tsx` file.
- **Performance Improvements:**
  - Resolved potential frame-rate drops by eliminating duplicate requestAnimationFrame loops.
  - Integrated system-level accessibility support using the custom `useLenis` / `prefers-reduced-motion` hook.
- **Validation Results:** Passed complete live browser runtime QA verification. The console is 100% clean of all warnings, errors, and custom logs on load and post-interaction.
- **Known Issues:** None.
- **Remaining Work:** Milestone 2 through 5 (implementing the natural forest descent, crop walk, harvesting/processing transitions, and the final studio showcase).
