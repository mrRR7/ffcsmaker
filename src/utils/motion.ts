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
  duration: 0.25,
};

// Global page transition (for template.tsx)
export const pageFade: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: -8, transition: { ...TRANSITION_TWEEN, duration: 0.2 } },
};

// Container for staggering children
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// Individual child fade up (to be used inside staggerContainer or standalone)
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: -10, transition: { ...TRANSITION_TWEEN, duration: 0.2 } },
};

// Modals, popovers, detail panels
export const popover: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: TRANSITION_SPRING },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { ...TRANSITION_TWEEN, duration: 0.15 } },
};

// Drawer style popover (for mobile)
export const popoverDrawer: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_SPRING },
  exit: { opacity: 0, y: 40, transition: { ...TRANSITION_TWEEN, duration: 0.15 } },
};

// Very subtle hover used on interactive cards, slots, buttons
export const subtleHover = {
  scale: 1.01,
  y: -1,
  transition: { duration: 0.15, ease: "easeOut" },
};

export const subtleTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};
