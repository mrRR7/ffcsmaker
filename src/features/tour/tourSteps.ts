import type { Placement } from "@floating-ui/react";
import { useAppStore } from "@/store/useAppStore";

export interface TourStep {
  id: string;
  route: string;
  targetId: string;
  title: string;
  body: string;
  placement?: Placement; // default "bottom"
  precondition?: () => boolean; // if false, step is skipped, not blocked on
  waitsForCampus?: boolean;
}

/** Snapshot of "had a campus when the tour started" — the campus step's
 * visibility must not flip mid-tour when the user picks one, or the
 * "STEP X OF Y" count would jump under them. Set by TourProvider.start(). */
let campusSetAtStart = false;
export function snapshotTourStart() {
  campusSetAtStart = !!useAppStore.getState().campus;
}

export function isStepVisible(step: TourStep): boolean {
  return step.precondition ? step.precondition() : true;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "home-welcome",
    route: "/",
    targetId: "home-cta",
    title: "Start here",
    body: "This takes you into the planner — that's where everything happens.",
  },
  {
    id: "campus-picker",
    route: "/planner",
    targetId: "campus-picker",
    title: "Pick your campus",
    body: "Decides which courses and slots you'll see — change it anytime from Settings.",
    // Skip this step once a campus is already chosen — read straight from the
    // Zustand store outside React (`.getState()`), which is why this module
    // stays a plain data file instead of a component.
    precondition: () => !campusSetAtStart,
    // The planner steps after this only mount once a campus exists, so this
    // step blocks on a pick instead of offering Next (see TourCard).
    waitsForCampus: true,
  },
  {
    id: "planner-add-courses",
    route: "/planner",
    targetId: "planner-add-courses",
    title: "Add your courses",
    body: "Search, paste a list, import a file, or type them in manually.",
  },
  {
    id: "planner-live-preview",
    route: "/planner",
    targetId: "planner-live-preview",
    title: "Your draft, live",
    body: "Everything you add shows up in this grid instantly, before you generate anything.",
  },
  {
    id: "planner-preferences",
    route: "/planner",
    targetId: "planner-preferences",
    title: "Set your preferences",
    body: "Block times, avoid professors, or skip this — it's optional.",
  },
  {
    id: "planner-generate",
    route: "/planner",
    targetId: "planner-generate",
    title: "Generate your weeks",
    body: "Finds every conflict-free timetable that fits what you picked.",
  },
  {
    id: "results-grid",
    route: "/results",
    targetId: "results-grid",
    title: "Browse your results",
    body: "Every generated timetable, ranked — click a cell for details.",
    // Skip the results steps entirely for a first-time user who hasn't
    // generated anything yet — otherwise they land on an empty results page
    // and each remaining step polls its full cap against a target that will
    // never mount.
    precondition: () => useAppStore.getState().generatedSchedules.length > 0,
  },
  {
    id: "results-export-share",
    route: "/results",
    targetId: "results-export-share",
    title: "Export or share",
    body: "Save it as an image or PDF, or share a link.",
    precondition: () => useAppStore.getState().generatedSchedules.length > 0,
  },
  {
    id: "results-save-register",
    route: "/results",
    targetId: "results-save-register",
    title: "Save it",
    body: "Keep it in Saved, or head off to register it in VTOP.",
    precondition: () => useAppStore.getState().generatedSchedules.length > 0,
  },
];
