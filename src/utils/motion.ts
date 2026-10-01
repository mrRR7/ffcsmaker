import { Variants } from "framer-motion";

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Motion tokens (transitions.dev scale) — seconds, mirroring the
// --duration-* / --ease-smooth-out / --blur-* vars in fp-transitions.css.
export const DUR = {
  stagger: 0.04,
  quick: 0.15,
  fast: 0.25,
  medium: 0.35,
  slow: 0.4
} as const;
export const EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1] as const;
const BLUR_MEDIUM = "blur(3px)";

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

// Container for staggering children: --duration-stagger per item, capped so
// the whole cascade stays under ~300ms (pass the item count as `custom`).
// Exits never stagger — dismissal should feel instant.
export const staggerContainer: Variants = {
  initial: {},
  animate: (count?: number) => ({
    transition: {
      staggerChildren: count && count * DUR.stagger > 0.3 ? 0.3 / count : DUR.stagger,
    },
  }),
  exit: {},
};

// Individual child fade up (tightened distance)
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: TRANSITION_TWEEN },
  exit: { opacity: 0, y: -4, transition: { ...TRANSITION_TWEEN, duration: 0.1 } },
};

// Anchored popovers / menus (dropdown): open 250ms from 0.97, close 150ms to 0.99.
export const popover: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: DUR.fast, ease: EASE_SMOOTH_OUT } },
  exit: { opacity: 0, scale: 0.99, transition: { duration: DUR.quick, ease: EASE_SMOOTH_OUT } },
};

// Centred dialogs: open 250ms from 0.96, close 150ms back to 0.96.
export const modal: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: DUR.fast, ease: EASE_SMOOTH_OUT } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DUR.quick, ease: EASE_SMOOTH_OUT } },
};

// Backdrop behind a modal — follows the dialog's open/close timing.
export const backdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.fast, ease: EASE_SMOOTH_OUT } },
  exit: { opacity: 0, transition: { duration: DUR.quick, ease: EASE_SMOOTH_OUT } },
};

// Page slide (routes, planner steps): 8px + 3px blur in over 250ms; the exit
// only fades (150ms) so, under AnimatePresence mode="wait", the hand-off stays
// short. `filter: none` at rest — a held blur(0) would become the containing
// block for position:fixed children.
export const routeSlide: Variants = {
  initial: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 8 : -8, filter: BLUR_MEDIUM }),
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: DUR.fast, ease: EASE_SMOOTH_OUT },
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, transition: { duration: DUR.quick, ease: EASE_SMOOTH_OUT } },
};

// Bottom sheet (mobile): panel timing — open 400ms, close 350ms.
export const popoverDrawer: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_SMOOTH_OUT } },
  exit: { opacity: 0, y: 20, transition: { duration: DUR.medium, ease: EASE_SMOOTH_OUT } },
};

// Removed layout-shifting hovers. Just subtle opacity or static.
export const subtleHover = {
  transition: { duration: 0.1, ease: "easeOut" },
};

export const subtleTap = {
  scale: 0.99,
  transition: { duration: 0.05 },
};
