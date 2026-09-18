"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { useTour } from "./useTour";
import { TOUR_STEPS } from "./tourSteps";

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
  const { active, currentStep, stepIndex, visibleStepNumber, visibleStepCount, isLastStep, back, next, skip } =
    useTour();
  const [targetEl, setTargetEl] = React.useState<Element | null>(null);

  const targetId = currentStep?.targetId;

  React.useEffect(() => {
    if (!targetId) {
      setTargetEl(null);
      return;
    }
    let frameId: number;
    const tick = () => {
      setTargetEl(document.querySelector(`[data-tour-id="${targetId}"]`));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetId]);

  const { refs, floatingStyles } = useFloating({
    open: active && !!targetEl,
    placement: currentStep?.placement ?? "bottom",
    strategy: "fixed",
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    refs.setReference(targetEl);
  }, [targetEl, refs]);

  if (!active || !currentStep || !targetEl || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={refs.setFloating}
      style={{ ...floatingStyles, boxShadow: "var(--shadow-overlay)" }}
      role="dialog"
      aria-labelledby="fp-tour-card-title"
      aria-describedby="fp-tour-card-body"
      className="z-[110] w-[320px] rounded-[var(--radius-lg)] bg-fp-bg-surface p-4"
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
        {TOUR_STEPS.map((step, i) => (
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

      <div className="mt-4 flex items-center justify-between">
        <FPButton variant="ghost" size="sm" onClick={skip}>
          Skip tour
        </FPButton>
        <div className="flex items-center gap-2">
          <FPButton variant="secondary" size="sm" onClick={back} disabled={stepIndex === 0}>
            Back
          </FPButton>
          <FPButton variant="primary" size="sm" onClick={next}>
            {isLastStep ? "Done" : "Next"}
          </FPButton>
        </div>
      </div>
    </div>,
    getTourPortalRoot()
  );
}
