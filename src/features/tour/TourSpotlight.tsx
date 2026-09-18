"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTourContext } from "./TourProvider";
import { TOUR_STEPS } from "./tourSteps";

const RING_PADDING = 4;

/**
 * Portals a highlight ring over the current step's target element and, via the
 * same rAF loop that keeps its own position in sync on scroll/resize, drives
 * `resync()` — the single mechanism that notices when the active target has
 * navigated away underneath the tour (route change or same-route tab swap).
 */
export function TourSpotlight() {
  const { active, stepIndex, resync } = useTourContext();
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }

    let frameId: number;
    const tick = () => {
      const step = TOUR_STEPS[stepIndex];
      const el = step ? document.querySelector(`[data-tour-id="${step.targetId}"]`) : null;
      setRect(el ? el.getBoundingClientRect() : null);
      resync();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, stepIndex, resync]);

  if (!active || !rect || typeof document === "undefined") return null;

  return createPortal(
    <>
      <style>{`
        @keyframes fp-tour-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed z-[100] rounded-[var(--radius-lg)]"
        style={{
          top: rect.top - RING_PADDING,
          left: rect.left - RING_PADDING,
          width: rect.width + RING_PADDING * 2,
          height: rect.height + RING_PADDING * 2,
          boxShadow: "var(--ring-focus)",
          animation: "fp-tour-pulse calc(var(--dur-base) * 6) var(--ease-standard) infinite",
        }}
      />
    </>,
    document.body
  );
}
