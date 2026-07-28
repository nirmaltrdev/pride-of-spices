import { createContext, useContext } from 'react';
import gsap from 'gsap';

export interface SceneContextType {
  masterTimeline: gsap.core.Timeline | null;
}

export const SceneContext = createContext<SceneContextType>({ masterTimeline: null });

export const useMasterTimeline = () => useContext(SceneContext);
