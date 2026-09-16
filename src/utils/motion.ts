import { Variants } from "framer-motion";

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Durations kept in sync with --dur-base/--dur-fast in fp-tokens.css
const TRANSITION_TWEEN = {
  type: "tween",
  ease: "easeOut",
  duration: 0.18,
};

// Critically-damped spring for the sliding nav pill — settles fast, no overshoot.
export const navPillSpring = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.5,
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

// Directional route transition — small nudge-fade, direction via `custom` prop.
export const routeSlide: Variants = {
  initial: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 16 : -16 }),
  animate: { opacity: 1, x: 0, transition: TRANSITION_TWEEN },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -16 : 16,
    transition: { ...TRANSITION_TWEEN, duration: 0.12 },
  }),
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
