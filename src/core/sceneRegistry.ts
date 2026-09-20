/**
 * SCENE REGISTRY — Single Source of Truth for Scene Timings & Scroll Mapping
 *
 * All scene boundaries, hold points (where narrative copy is 100% visible and readable),
 * and scroll transitions are defined here.
 *
 * Rules:
 * - NO hardcoded `innerHeight * N` formulas in components.
 * - Dynamic scroll target mapping derived from ScrollTrigger instance bounds.
 */

export interface SceneDefinition {
  id: string;
  label: string;
  sceneNumber: string;
  /** Normalized start on master timeline (0.0 - 1.0) */
  timelineStart: number;
  /** Normalized hold point where headline & copy are fully visible at opacity >= 0.95 */
  holdPoint: number;
  /** Normalized point where scene exit starts */
  exitStart: number;
  /** Normalized point where scene is completely exited */
  timelineEnd: number;
  /** Whether this scene lives outside the sticky container in DOM page flow */
  isPageFlow?: boolean;
}

export const SCENE_REGISTRY: SceneDefinition[] = [
  {
    id: 'arrival',
    label: 'The Arrival',
    sceneNumber: '01',
    timelineStart: 0.00,
    holdPoint: 0.04,
    exitStart: 0.10,
    timelineEnd: 0.18,
  },
  {
    id: 'forest',
    label: 'The Forest',
    sceneNumber: '02',
    timelineStart: 0.10,
    holdPoint: 0.18,
    exitStart: 0.26,
    timelineEnd: 0.32,
  },
  {
    id: 'discovery',
    label: 'The Discovery',
    sceneNumber: '03',
    timelineStart: 0.24,
    holdPoint: 0.35,
    exitStart: 0.50,
    timelineEnd: 0.56,
  },
  {
    id: 'harvest',
    label: 'The Harvest',
    sceneNumber: '04',
    timelineStart: 0.50,
    holdPoint: 0.60,
    exitStart: 0.70,
    timelineEnd: 0.76,
  },
  {
    id: 'honey',
    label: 'Wild Honey',
    sceneNumber: '4.5',
    timelineStart: 0.68,
    holdPoint: 0.82,
    exitStart: 0.94,
    timelineEnd: 0.98,
  },
  {
    id: 'collection',
    label: 'Collection',
    sceneNumber: '05',
    timelineStart: 0.96,
    holdPoint: 1.00,
    exitStart: 1.00,
    timelineEnd: 1.00,
    isPageFlow: true,
  },
];

/**
 * Returns the active scene index given normalized master timeline progress (0.0 - 1.0).
 */
export function getActiveSceneFromProgress(progress: number): number {
  if (progress >= 0.93) return 5; // Collection
  if (progress >= 0.73) return 4; // Honey
  if (progress >= 0.53) return 3; // Harvest
  if (progress >= 0.28) return 2; // Discovery
  if (progress >= 0.08) return 1; // Forest
  return 0; // Arrival
}

/**
 * Registry helper to get a scene by ID.
 */
export function getSceneById(id: string): SceneDefinition | undefined {
  return SCENE_REGISTRY.find(s => s.id === id);
}
