# System Architecture

The **Pride of Spices** platform is engineered as a robust, decoupled, and scalable cinematic engine rather than a traditional webpage. It relies heavily on strict module boundaries, a centralized Single Source of Truth, and event-driven communication.

## 1. Single Source of Truth (SSOT)
To prevent race conditions and conflicting state management, core systems have exactly one owner:
- **Virtual Camera:** Owns `x`, `y`, `z`, `velocity`, `progress`, `focus`, `depth`, and `parallax`.
- **Scene Registry:** Owns scene definitions, boundaries, and timings.
- **Lenis Instance:** Owns the virtual scroll engine state.
- **Navigation State:** Owns the current target ID and routing logic.
- **Active Scene/Overlay:** Owns active UI focus and rendering prioritization.

## 2. Virtual Camera
The Virtual Camera represents the physical viewport moving through the environment.
- Scenes **must not** control global movement.
- Scenes **react** to the camera's state. 
- Conceptually: `Virtual Camera -> Camera Position -> Scene Manager -> Scenes React`.

## 3. Scene Registry
Hardcoded percentage-based scroll mapping is prohibited.
- Scenes are registered with logical IDs (`ARRIVAL`, `FOREST`, `HARVEST`).
- The Registry calculates timings dynamically based on registered Scene lengths.
- Navigation routes target Scene IDs, not scroll percentages.

## 4. Centralized Event Bus
Scenes must remain completely decoupled. All cross-module communication happens via the Event Bus.
- **Allowed Events:** `CAMERA_MOVED`, `SCENE_ENTER`, `SCENE_EXIT`, `OVERLAY_OPEN`, `OVERLAY_CLOSE`, `ASSETS_READY`, `NAVIGATION_REQUEST`.
- Unrestricted event creation by individual scenes is prohibited.

## 5. Scene Lifecycle
Every cinematic scene must implement the `CinematicScene` contract and strictly adhere to the following lifecycle managed by the SceneManager:
`Initialize → Preload Assets → Mount → Enter → Active → Pause → Resume → Exit → Destroy`

## 6. Asset Pipeline & Manifest
All assets must be registered in a centralized Asset Manifest.
- Required metadata: `id`, `path`, `type`, `preload priority`, `estimated size`, `fallback`, `ownership`.
- Assets follow a staged progressive loading model (Initial -> Background -> Lazy Load) to optimize Time to Interactive.
- High-res images must be served responsively via `<picture>` using `AVIF`/`WebP`.

## 7. Performance Strategy
The architecture guarantees performance through strict monitoring and degradation limits.
- Development builds include a HUD to monitor FPS, active timelines, and memory.
- If frames drop below 30FPS or capability detection flags constrained hardware, the system degrades visual fidelity automatically (e.g., removing heavy particles).
