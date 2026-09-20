

export const motion = {
  easing: {
    cinematic: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
    smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    outExpo: [0.19, 1, 0.22, 1] as [number, number, number, number],
  },
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 0.8,
    verySlow: 1.2,
    sceneTransition: 0.8,
  }
} as const;
