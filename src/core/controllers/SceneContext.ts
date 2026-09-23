import { createContext, useContext } from 'react';
import gsap from 'gsap';

export interface SceneContextType {
  masterTimeline: gsap.core.Timeline | null;
  registerScene: (id: string) => void;
  unregisterScene: (id: string) => void;
  syncTimeline: () => void;
}

export const SceneContext = createContext<SceneContextType>({
  masterTimeline: null,
  registerScene: () => {},
  unregisterScene: () => {},
  syncTimeline: () => {},
});

export const useMasterTimeline = () => useContext(SceneContext);

