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
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "home-welcome",
    route: "/new",
    targetId: "home-cta",
    title: "Start here",
    body: "This takes you into the planner — that's where everything happens.",
  },
  {
    id: "campus-picker",
    route: "/new/planner",
    targetId: "campus-picker",
    title: "Pick your campus",
    body: "Decides which courses and slots you'll see — change it anytime from Settings.",
    // Skip this step once a campus is already chosen — read straight from the
    // Zustand store outside React (`.getState()`), which is why this module
    // stays a plain data file instead of a component.
    precondition: () => !useAppStore.getState().campus,
  },
  {
    id: "planner-add-courses",
    route: "/new/planner",
    targetId: "planner-add-courses",
    title: "Add your courses",
    body: "Search, paste a list, import a file, or type them in manually.",
  },
  {
    id: "planner-live-preview",
    route: "/new/planner",
    targetId: "planner-live-preview",
    title: "Your draft, live",
    body: "Everything you add shows up in this grid instantly, before you generate anything.",
  },
  {
    id: "planner-preferences",
    route: "/new/planner",
    targetId: "planner-preferences",
    title: "Set your preferences",
    body: "Block times, avoid professors, or skip this — it's optional.",
  },
  {
    id: "planner-generate",
    route: "/new/planner",
    targetId: "planner-generate",
    title: "Generate your weeks",
    body: "Finds every conflict-free timetable that fits what you picked.",
  },
  {
    id: "results-grid",
    route: "/new/results",
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
    route: "/new/results",
    targetId: "results-export-share",
    title: "Export or share",
    body: "Save it as an image or PDF, or share a link.",
    precondition: () => useAppStore.getState().generatedSchedules.length > 0,
  },
  {
    id: "results-save-register",
    route: "/new/results",
    targetId: "results-save-register",
    title: "Save it",
    body: "Keep it in Saved, or head off to register it in VTOP.",
    precondition: () => useAppStore.getState().generatedSchedules.length > 0,
  },
];
