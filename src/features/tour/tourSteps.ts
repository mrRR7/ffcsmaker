import type { Placement } from "@floating-ui/react";
import { useAppStore } from "@/store/useAppStore";
import { PROGRAM_PICKER_ENABLED } from "@/features/programs/programCatalog";

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
  const { campus, programChosen } = useAppStore.getState();
  // The program picker is part of the campus step, so "set" means both answered.
  campusSetAtStart = !!campus && (programChosen || !PROGRAM_PICKER_ENABLED);
}

/** Results exist, or a search is running and about to land on /results. */
const hasResults = () => {
  const { generatedSchedules, generation } = useAppStore.getState();
  return generatedSchedules.length > 0 || generation.running;
};

/** The on-screen element for a target id. Phone and desktop can each render
 * their own copy (e.g. two "Find my weeks" buttons), so skip hidden ones. */
export function findTourTarget(targetId: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour-id="${targetId}"]`);
  return Array.from(all).find((el) => el.getClientRects().length > 0) ?? null;
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
    body: "Then your program, if it's asked. Decides which courses and slots you'll see — change it anytime from Settings.",
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
    // Phones drop the live grid (too wide to read); Results shows the real one.
    // Also evaluated while server-rendering (step counts), where there's no window.
    precondition: () => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches,
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
    precondition: hasResults,
  },
  {
    id: "results-swap",
    route: "/results",
    targetId: "results-swap",
    title: "Swap a professor",
    body: "Same week, different professor. Pick one here and the grid updates.",
    // Not every week has a choice; with nothing to swap the panel doesn't
    // mount and the poll moves on.
    precondition: hasResults,
  },
  {
    id: "results-export-share",
    route: "/results",
    targetId: "results-export-share",
    title: "Export or share",
    body: "Save it as an image or PDF, or share a link.",
    precondition: hasResults,
  },
  {
    id: "results-save-register",
    route: "/results",
    targetId: "results-save-register",
    title: "Save it",
    body: "Keep it in Saved, or head off to register it in VTOP.",
    precondition: hasResults,
  },
];
