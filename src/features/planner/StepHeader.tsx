import { cn } from "@/utils/cn";

interface StepHeaderProps {
  currentStep: 1 | 2 | 3;
  totalSteps: number;
  title: string;
  onStepClick: (step: 1 | 2 | 3) => void;
}

export function StepHeader({ currentStep, totalSteps, title, onStepClick }: StepHeaderProps) {
  return (
    <div className="shrink-0 border-b border-hairline bg-canvas px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">Step {currentStep} of {totalSteps}</span>
        <h1 className="text-base font-semibold">{title}</h1>
        <div className="w-12" /> {/* spacer for visual balance */}
      </div>
      {/* Step dots — tappable to jump directly, not just sequential */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <button
            key={s}
            onClick={() => onStepClick(s as 1 | 2 | 3)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              s === currentStep ? "bg-ink" : s < currentStep ? "bg-ink/40" : "bg-hairline"
            )}
            aria-label={`Go to step ${s}`}
          />
        ))}
      </div>
    </div>
  );
}
