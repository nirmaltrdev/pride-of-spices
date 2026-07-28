export const camera = {
  speed: {
    default: 1.0,
    slow: 0.8,
    fast: 1.5,
  },
  perspective: '1200px',
  inertia: 1.8, // Scrub value for ScrollTrigger
  parallax: {
    shallow: 0.2,
    medium: 0.5,
    deep: 0.8,
  }
} as const;
