import { Variants } from "framer-motion";

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const TRANSITION_TWEEN = {
  type: "tween",
  ease: "easeOut",
  duration: 0.15,
};

// Global page transition (for template.tsx)
export const pageFade: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: -4, transition: { ...TRANSITION_TWEEN, duration: 0.1 } },
};

// Container for staggering children (made very fast)
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
};

// Individual child fade up (tightened distance)
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: -4, transition: { ...TRANSITION_TWEEN, duration: 0.1 } },
};

// Modals, popovers, detail panels
export const popover: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { ...TRANSITION_TWEEN, duration: 0.1 } },
};

// Drawer style popover (for mobile)
export const popoverDrawer: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: 20, transition: { ...TRANSITION_TWEEN, duration: 0.1 } },
};

// Removed layout-shifting hovers. Just subtle opacity or static.
export const subtleHover = {
  transition: { duration: 0.1, ease: "easeOut" },
};

export const subtleTap = {
  scale: 0.99,
  transition: { duration: 0.05 },
};
