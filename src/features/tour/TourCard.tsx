"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { useTour } from "./useTour";
import { TOUR_STEPS, findTourTarget, isStepVisible } from "./tourSteps";
import { useAppStore } from "@/store/useAppStore";
import { usePlannerGeneration } from "@/features/planner/usePlannerGeneration";
import { SAMPLE_COURSE_CODES } from "./sampleCourses";

/** Every fp-* CSS variable/class is scoped under `.fp-root` (see fp-tokens.css) —
 * portaling to `document.body` directly would escape that scope and render
 * unstyled. `.fp-root` still sits high enough in the tree to clear any
 * component-level `overflow: hidden`, which is the actual reason to portal. */
function getTourPortalRoot(): Element {
  const root = document.querySelector(".fp-root");
  if (!root && process.env.NODE_ENV !== "production") {
    console.warn("[tour] .fp-root not found — falling back to document.body (fp-* tokens won't resolve there)");
  }
  return root ?? document.body;
}

/**
 * Floating card anchored to the current step's target element. Positioning
 * uses `@floating-ui/react` directly against the live `[data-tour-id]` node
 * (found by querySelector, same as TourSpotlight) rather than a React ref,
 * since the target is owned by whatever page Task 2 wires up, not by this
 * component.
 */
export function TourCard() {
  const {
    active,
    currentStep,
    stepIndex,
    visibleStepNumber,
    visibleStepCount,
    isLastStep,
    sampleLoaded,
    loadSample,
    back,
    next,
    skip,
    finish
  } = useTour();
  const [targetEl, setTargetEl] = React.useState<Element | null>(null);
  const [loadingSample, setLoadingSample] = React.useState(false);
  const { runGeneration } = usePlannerGeneration();

  const targetId = currentStep?.targetId;
  const campus = useAppStore((s) => s.campus);
  const planIsEmpty = useAppStore((s) => s.courses.length === 0);
  // The program picker reuses the campus step's target, so keep waiting while
  // either gate is on screen; the planner mounting is what ends the wait.
  const waitingForCampus = !!currentStep?.waitsForCampus && (!campus || targetEl !== null);
  const offerSample =
    currentStep?.id === "planner-add-courses" && planIsEmpty && !!campus && !!SAMPLE_COURSE_CODES[campus]?.length;
  const runsSample = sampleLoaded && currentStep?.id === "planner-generate";
  // Before a search the results steps don't count yet, so the generate step
  // reads as "last"; it still has to run the search first.
  const endsSample = sampleLoaded && isLastStep && !runsSample;

  // Picking a campus IS the action this step asks for — advance on it instead
  // of making the user also hit Next.
  const wasWaiting = React.useRef(false);
  React.useEffect(() => {
    if (wasWaiting.current && !waitingForCampus && currentStep?.waitsForCampus) next();
    wasWaiting.current = waitingForCampus;
  }, [waitingForCampus, currentStep, next]);

  React.useEffect(() => {
    if (!targetId) {
      setTargetEl(null);
      return;
    }
    let frameId: number;
    const tick = () => {
      setTargetEl(findTourTarget(targetId));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetId]);

  const { refs, floatingStyles } = useFloating({
    open: active && !!targetEl,
    placement: currentStep?.placement ?? "bottom",
    strategy: "fixed",
    // crossAxis: on phones a target can be taller than the screen (the home
    // campus grid); keep the card on screen even if it overlaps the target.
    middleware: [offset(10), flip(), shift({ padding: 8, crossAxis: true })],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    refs.setReference(targetEl);
  }, [targetEl, refs]);

  // The card unmounts between steps while the next target mounts, which drops
  // focus to <body>. Put it back on the primary button so keyboard users can
  // keep pressing Next — but never pull focus from somewhere the user put it.
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const hasCard = Boolean(active && currentStep && targetEl);
  React.useEffect(() => {
    if (!hasCard) return;
    const lost = !document.activeElement || document.activeElement === document.body;
    if (lost) primaryRef.current?.focus({ preventScroll: true });
  }, [hasCard, stepIndex]);

  if (!active || !currentStep || !targetEl || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={refs.setFloating}
      style={{ ...floatingStyles, boxShadow: "var(--shadow-overlay)" }}
      role="dialog"
      aria-labelledby="fp-tour-card-title"
      aria-describedby="fp-tour-card-body"
      className="z-[110] w-[320px] max-w-[calc(100vw-16px)] rounded-[var(--radius-lg)] bg-fp-bg-surface p-4"
    >
      <FPLabel variant="eyebrow">
        STEP {visibleStepNumber} OF {visibleStepCount}
      </FPLabel>

      <h3 id="fp-tour-card-title" className="fp-text mt-2 text-[length:var(--text-body-size)] font-semibold text-fp-text-strong">
        {currentStep.title}
      </h3>
      <p id="fp-tour-card-body" className="fp-text mt-1 text-[length:var(--text-small)] text-fp-text-body">
        {currentStep.body}
      </p>

      {/* Progress dots — same active/done/upcoming distinction as FPStepNav: accent
          marks done, neutral-strong marks "you are here", dim marks upcoming. */}
      <div className="mt-3 flex items-center gap-1.5">
        {TOUR_STEPS.map((step, i) => ({ step, i }))
          .filter(({ step, i }) => i === stepIndex || isStepVisible(step))
          .map(({ step, i }) => (
          <span
            key={step.id}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < stepIndex && "bg-fp-accent",
              i === stepIndex && "bg-fp-text-strong",
              i > stepIndex && "bg-fp-text-dim opacity-40"
            )}
          />
        ))}
      </div>

      {offerSample ? (
        <FPButton
          variant="secondary"
          className="mt-4 min-h-[44px] w-full"
          loading={loadingSample}
          onClick={() => {
            setLoadingSample(true);
            loadSample().finally(() => setLoadingSample(false));
          }}
        >
          Try it with sample courses
        </FPButton>
      ) : null}

      {endsSample ? (
        <div className="mt-4 flex flex-col gap-2">
          <FPButton ref={primaryRef} variant="primary" className="min-h-[44px] w-full" onClick={() => finish()}>
            Clear and start my own
          </FPButton>
          <FPButton variant="secondary" className="min-h-[44px] w-full" onClick={() => finish({ keep: true })}>
            Keep these courses
          </FPButton>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between">
          <FPButton variant="ghost" size="sm" onClick={skip}>
            Skip tour
          </FPButton>
          <div className="flex items-center gap-2">
            <FPButton variant="secondary" size="sm" onClick={back} disabled={stepIndex === 0}>
              Back
            </FPButton>
            {waitingForCampus ? (
              <span className="fp-text text-[length:var(--text-small)] text-fp-text-dim">Pick one to continue</span>
            ) : runsSample ? (
              <FPButton
                ref={primaryRef}
                variant="primary"
                size="sm"
                onClick={() => {
                  runGeneration();
                  next();
                }}
              >
                Find my weeks
              </FPButton>
            ) : (
              <FPButton ref={primaryRef} variant="primary" size="sm" onClick={next}>
                {isLastStep ? "Done" : "Next"}
              </FPButton>
            )}
          </div>
        </div>
      )}
    </div>,
    getTourPortalRoot()
  );
}
