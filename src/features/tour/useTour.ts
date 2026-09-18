import { useTourContext } from "./TourProvider";

/** Thin public hook for tour consumers (nav entry points, the tour card itself). */
export function useTour() {
  const {
    active,
    currentStep,
    stepIndex,
    totalSteps,
    visibleStepNumber,
    visibleStepCount,
    isLastStep,
    start,
    next,
    back,
    skip,
  } = useTourContext();
  return {
    active,
    currentStep,
    stepIndex,
    totalSteps,
    visibleStepNumber,
    visibleStepCount,
    isLastStep,
    start,
    next,
    back,
    skip,
  };
}
