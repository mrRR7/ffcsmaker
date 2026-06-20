import { useState, useEffect } from "react";
import { StepHeader } from "./StepHeader";
import { StepBottomBar } from "./StepBottomBar";
import { StepCourses } from "./steps/StepCourses";
import { StepConstraints } from "./steps/StepConstraints";
import { StepReview } from "./steps/StepReview";
import { usePlannerGeneration } from "./usePlannerGeneration";
import { useAppStore } from "@/store/useAppStore";
import { prewarmCatalogCache } from "@/lib/catalogCache";

export function MobilePlannerFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showNotice, setShowNotice] = useState(false);
  const campus = useAppStore((state) => state.campus);
  const courses = useAppStore((state) => state.courses);

  const { runGeneration, cancel, isGenerating, progress, checked, accepted } =
    usePlannerGeneration();

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_preliminary_notice");
    if (!dismissed) {
      setShowNotice(true);
    }
  }, []);

  useEffect(() => {
    if (campus) {
      void prewarmCatalogCache(campus);
    }
  }, [campus]);

  function handleDismissNotice() {
    localStorage.setItem("dismissed_preliminary_notice", "true");
    setShowNotice(false);
  }

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }

  const stepTitles = {
    1: "Add Courses",
    2: "Constraints",
    3: "Review & Generate",
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-canvas text-ink h-[100dvh]">
      <StepHeader
        currentStep={step}
        totalSteps={3}
        title={stepTitles[step]}
        onStepClick={setStep}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
        {step === 1 && (
          <StepCourses showNotice={showNotice} onDismissNotice={handleDismissNotice} />
        )}
        {step === 2 && <StepConstraints />}
        {step === 3 && (
          <StepReview
            onGoToStep={setStep}
            isGenerating={isGenerating}
            progress={progress}
            checked={checked}
            accepted={accepted}
          />
        )}
      </div>

      <StepBottomBar
        step={step}
        courseCount={courses.length}
        onBack={handleBack}
        onNext={handleNext}
        isGenerating={isGenerating}
        runGeneration={runGeneration}
        cancelGeneration={cancel}
      />
    </div>
  );
}
