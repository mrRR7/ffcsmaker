import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepBottomBarProps {
  step: 1 | 2 | 3;
  courseCount: number;
  onBack: () => void;
  onNext: () => void;
  isGenerating: boolean;
  runGeneration: () => void;
  cancelGeneration: () => void;
}

export function StepBottomBar({
  step,
  courseCount,
  onBack,
  onNext,
  isGenerating,
  runGeneration,
  cancelGeneration,
}: StepBottomBarProps) {
  return (
    <div className="shrink-0 border-t border-hairline bg-canvas px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            ← Back
          </Button>
        )}

        {step < 3 && (
          <Button
            onClick={onNext}
            className="flex-1"
            disabled={step === 1 && courseCount === 0}
          >
            {step === 1
              ? `Next${courseCount > 0 ? ` (${courseCount} added)` : ""}`
              : "Next"}
            →
          </Button>
        )}

        {step === 3 && (
          <Button
            type="button"
            className="flex-1"
            variant={isGenerating ? "secondary" : "default"}
            onClick={isGenerating ? cancelGeneration : runGeneration}
          >
            <Play className="h-4 w-4" />
            {isGenerating ? "Cancel" : "Generate"}
          </Button>
        )}
      </div>
    </div>
  );
}
