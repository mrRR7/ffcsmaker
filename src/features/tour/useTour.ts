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
    sampleLoaded,
    loadSample,
    start,
    next,
    back,
    skip,
    finish,
  } = useTourContext();
  return {
    active,
    currentStep,
    stepIndex,
    totalSteps,
    visibleStepNumber,
    visibleStepCount,
    isLastStep,
    sampleLoaded,
    loadSample,
    start,
    next,
    back,
    skip,
    finish,
  };
}
