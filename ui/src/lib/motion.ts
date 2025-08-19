import { Variants } from 'framer-motion';

// Motion presets for consistent animations
export const motionPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' as const }
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },

  // Slide animations
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },

  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },

  slideInUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },

  // Scale animations
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' as const }
  },

  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  }
};

// Variants for complex animations
export const sidebarVariants: Variants = {
  open: {
    width: '280px',
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },
  closed: {
    width: '80px',
    transition: { duration: 0.2, ease: 'easeIn' as const }
  }
};

export const drawerVariants: Variants = {
  open: {
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },
  closed: {
    x: '100%',
    transition: { duration: 0.2, ease: 'easeIn' as const }
  }
};

export const modalVariants: Variants = {
  open: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },
  closed: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' as const }
  }
};

export const backdropVariants: Variants = {
  open: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const }
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const }
  }
};

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  in: {
    opacity: 1,
    x: 0
  },
  out: {
    opacity: 0,
    x: -20
  }
};

export const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.2
};

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.15, ease: 'easeOut' as const }
};

export const hoverLift = {
  y: -2,
  transition: { duration: 0.15, ease: 'easeOut' as const }
};

// Utility functions
export const createStaggerAnimation = (delay: number = 0.05) => ({
  animate: {
    transition: {
      staggerChildren: delay
    }
  }
});

export const createFadeInAnimation = (direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
  const variants = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return {
    initial: { opacity: 0, ...variants[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.2, ease: 'easeOut' as const }
  };
};
