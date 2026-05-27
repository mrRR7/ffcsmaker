"use client";

import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export type ImportStep = "upload" | "detect" | "review" | "confirm";

const steps: { id: ImportStep; label: string; num: number }[] = [
  { id: "upload", label: "Upload", num: 1 },
  { id: "detect", label: "Detect", num: 2 },
  { id: "review", label: "Review", num: 3 },
  { id: "confirm", label: "Confirm", num: 4 }
];

export function ImportStepper({ currentStepId }: { currentStepId: ImportStep }) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="mb-8 flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.id} className="relative flex flex-1 items-center justify-center">
            {/* Connecting line */}
            {index !== 0 && (
              <div
                className={cn(
                  "absolute left-0 top-4 -translate-y-1/2 -translate-x-1/2 h-0.5 w-[calc(100%-2rem)]",
                  isCompleted || isActive ? "bg-primary" : "bg-border"
                )}
              />
            )}
            
            <div className="relative flex flex-col items-center group">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors bg-background",
                  isActive
                    ? "border-primary text-primary"
                    : isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.num}
              </div>
              <span
                className={cn(
                  "absolute -bottom-6 whitespace-nowrap text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
