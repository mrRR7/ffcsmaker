"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_STEPS, type TourStep } from "./tourSteps";
import { markTourSeen } from "./tourStorage";

const POLL_TICK_MS = 100;
const POLL_CAP_MS = 2000;

interface TourState {
  active: boolean;
  stepIndex: number;
}

interface TourContextValue extends TourState {
  currentStep: TourStep | undefined;
  totalSteps: number;
  /** 1-based position of the current step among only steps whose
   * precondition currently passes — for "STEP X OF Y" display. */
  visibleStepNumber: number;
  /** Count of currently-passing-precondition steps — the Y in "STEP X OF Y". */
  visibleStepCount: number;
  /** True when there's no further step with a passing precondition — i.e.
   * this is the last one the user will actually see. */
  isLastStep: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  resync: () => void;
}

const TourContext = React.createContext<TourContextValue | null>(null);

function isValid(step: TourStep): boolean {
  return step.precondition ? step.precondition() : true;
}

function isTargetVisible(targetId: string): boolean {
  const el = document.querySelector(`[data-tour-id="${targetId}"]`);
  return el !== null && el.isConnected && (el as HTMLElement).offsetParent !== null;
}

/** First index >= from whose precondition passes, or -1 if none remain. */
function findForward(from: number): number {
  for (let i = from; i < TOUR_STEPS.length; i++) {
    if (isValid(TOUR_STEPS[i])) return i;
  }
  return -1;
}

/** First index <= from (searching backwards) whose precondition passes, or -1 if none. */
function findBackward(from: number): number {
  for (let i = from; i >= 0; i--) {
    if (isValid(TOUR_STEPS[i])) return i;
  }
  return -1;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<TourState>({ active: false, stepIndex: 0 });
  const pathname = usePathname();
  const router = useRouter();

  // Latest pathname/state in refs so the poll callbacks (set up on click, resolving
  // up to 2s later) always act on current values instead of a stale closure.
  const pathnameRef = React.useRef(pathname);
  pathnameRef.current = pathname;
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const pollCleanupRef = React.useRef<(() => void) | null>(null);

  const cancelPoll = React.useCallback(() => {
    pollCleanupRef.current?.();
    pollCleanupRef.current = null;
  }, []);

  const endTour = React.useCallback(() => {
    cancelPoll();
    setState((s) => ({ ...s, active: false }));
    markTourSeen();
  }, [cancelPoll]);

  /** Navigate to `index`, waiting (poll, 2s cap) for its target to mount before
   * treating it as positioned. On timeout, moves on rather than getting stuck —
   * forward past `index` for goToNext, backward for goToNext=false. */
  const goTo = React.useCallback(
    (index: number, direction: "forward" | "backward") => {
      const resolvedIndex = direction === "forward" ? findForward(index) : findBackward(index);
      if (resolvedIndex === -1) {
        // Forward: ran off the last step — the tour is complete.
        // Backward: nothing earlier to show — stay put rather than ending the tour.
        if (direction === "forward") endTour();
        else cancelPoll();
        return;
      }

      const step = TOUR_STEPS[resolvedIndex];
      if (step.route !== pathnameRef.current) {
        router.push(step.route);
      }
      setState({ active: true, stepIndex: resolvedIndex });

      cancelPoll();
      const startedAt = Date.now();
      const intervalId = window.setInterval(() => {
        if (isTargetVisible(step.targetId)) {
          cancelPoll();
          document
            .querySelector(`[data-tour-id="${step.targetId}"]`)
            ?.scrollIntoView({ block: "center", behavior: "smooth" });
          return;
        }
        if (Date.now() - startedAt >= POLL_CAP_MS) {
          cancelPoll();
          // If the user has navigated away from the route this goTo pushed
          // to, the timeout means "user left", not "target never mounted" —
          // forcing them back with a push would violate the tour's
          // never-push-the-user-back invariant. End quietly instead. Only
          // treat this as a genuine mount failure (and advance) when they're
          // still on the expected route.
          if (pathnameRef.current !== step.route) {
            endTour();
            return;
          }
          const nextIndex = direction === "forward" ? resolvedIndex + 1 : resolvedIndex - 1;
          goTo(nextIndex, direction);
        }
      }, POLL_TICK_MS);
      pollCleanupRef.current = () => window.clearInterval(intervalId);
    },
    [cancelPoll, endTour, router]
  );

  // Reuses goTo's route-push + poll (same as next()/back()) rather than a bare
  // state-set: start() is now called from entry points that aren't guaranteed
  // to already be on the first step's route (header "?" button, Settings
  // "Replay tour" row), and a bare state-set left resync() racing the very
  // next animation frame against a pathname that hadn't changed yet — it would
  // find no step matching the current route and end the tour instantly. goTo
  // already no-ops when the route matches (no redundant push), so this is a
  // no-behavior-change for the existing home-page entry point.
  const start = React.useCallback(() => {
    goTo(0, "forward");
  }, [goTo]);

  const next = React.useCallback(() => {
    goTo(stateRef.current.stepIndex + 1, "forward");
  }, [goTo]);

  const back = React.useCallback(() => {
    goTo(stateRef.current.stepIndex - 1, "backward");
  }, [goTo]);

  const resync = React.useCallback(() => {
    if (!stateRef.current.active) return;
    // A goTo() poll is already resolving the current transition (route push +
    // waiting up to 2s for the new target) — let it finish instead of racing
    // it. Without this, resync() fires on the very next animation frame after
    // next()/back() and sees the pre-navigation route/target, wrongly
    // reverting stepIndex or ending the tour before the poll ever gets a
    // chance.
    if (pollCleanupRef.current) return;

    const current = TOUR_STEPS[stateRef.current.stepIndex];
    if (current && isTargetVisible(current.targetId)) return;

    // Note: unlike findForward/findBackward, this search doesn't re-check
    // `precondition` — it can in theory land on a step that should have been
    // skipped. The brief's resync algorithm doesn't call for that check either.
    const found = TOUR_STEPS.find(
      (step) => step.route === pathnameRef.current && isTargetVisible(step.targetId)
    );
    if (found) {
      setState((s) => ({ ...s, stepIndex: TOUR_STEPS.indexOf(found) }));
      return;
    }
    endTour();
  }, [endTour]);

  React.useEffect(() => cancelPoll, [cancelPoll]);

  const currentStep = state.active ? TOUR_STEPS[state.stepIndex] : undefined;

  // Progress against the *currently-passing-precondition* steps, not the raw
  // index — recomputed fresh on every render (TOUR_STEPS has 9 entries, so
  // looping is free) from live store state via isValid/findForward, the same
  // helpers goTo uses. Deliberately NOT useMemo'd on state.stepIndex: a
  // precondition can flip (e.g. generatedSchedules 0 -> N) between renders
  // that don't change stepIndex's numeric value (e.g. start() resetting to
  // stepIndex 0 when it was already 0), and a memo keyed only on stepIndex
  // would then serve a stale count from before the flip.
  let visibleStepCount = 0;
  for (let i = 0; i < TOUR_STEPS.length; i++) {
    if (isValid(TOUR_STEPS[i])) visibleStepCount++;
  }

  let visibleStepNumber = 0;
  for (let i = 0; i <= state.stepIndex; i++) {
    if (isValid(TOUR_STEPS[i])) visibleStepNumber++;
  }

  const isLastStep = findForward(state.stepIndex + 1) === -1;

  const value = React.useMemo<TourContextValue>(
    () => ({
      active: state.active,
      stepIndex: state.stepIndex,
      currentStep,
      totalSteps: TOUR_STEPS.length,
      visibleStepNumber,
      visibleStepCount,
      isLastStep,
      start,
      next,
      back,
      skip: endTour,
      finish: endTour,
      resync,
    }),
    [
      state.active,
      state.stepIndex,
      currentStep,
      visibleStepNumber,
      visibleStepCount,
      isLastStep,
      start,
      next,
      back,
      endTour,
      resync,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

/** Full context, including internals (`resync`, `finish`) that `useTour` doesn't
 * surface — for the presentational pieces (TourSpotlight) that drive the loop. */
export function useTourContext(): TourContextValue {
  const ctx = React.useContext(TourContext);
  if (!ctx) throw new Error("useTourContext must be used within a TourProvider");
  return ctx;
}
