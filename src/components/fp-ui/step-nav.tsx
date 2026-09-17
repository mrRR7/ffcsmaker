import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * StepNav — "01 COURSES / 02 PREFERENCES / 03 RESULTS". Active step gets an
 * accent bottom border and an accent-colored number; completed steps show a
 * check instead of their number.
 */
export interface FPStep {
  number: string;
  label: string;
  status?: "upcoming" | "active" | "done";
  suffix?: React.ReactNode;
  onClick?: () => void;
  /** True when this step can't be reached yet (e.g. no results to show). Renders
   * visually inert — dimmed, no hover feedback, `cursor-not-allowed` — instead of
   * looking identical to a clickable step that silently does nothing when pressed. */
  disabled?: boolean;
}

export interface FPStepNavProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: FPStep[];
}

export function FPStepNav({ steps, className, ...props }: FPStepNavProps) {
  return (
    <div className={cn("flex bg-fp-bg-inset border-b border-fp-border-default", className)} {...props}>
      {steps.map((step, index) => {
        const isActive = step.status === "active";
        const isDone = step.status === "done";
        const isClickable = Boolean(step.onClick) && !step.disabled;
        const Wrapper = isClickable ? "button" : "div";
        return (
          <Wrapper
            key={step.label}
            type={isClickable ? "button" : undefined}
            disabled={Wrapper === "button" ? step.disabled : undefined}
            onClick={isClickable ? step.onClick : undefined}
            className={cn(
              "fp-label flex flex-1 items-center gap-3 px-5 py-3 text-[length:var(--text-micro)] text-left transition-colors",
              index < steps.length - 1 && "border-r border-fp-border-default",
              isActive
                ? "border-b-2 border-b-fp-accent text-fp-text-strong"
                : step.disabled
                  ? "cursor-not-allowed text-fp-text-dim opacity-40"
                  : isClickable
                    ? "cursor-pointer text-fp-text-dim hover:text-fp-text-body"
                    : "text-fp-text-dim"
            )}
            style={isActive ? { backgroundColor: "var(--accent-wash)" } : undefined}
          >
            <span className={isActive || isDone ? "text-fp-accent" : undefined}>
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : step.number}
            </span>
            <span>{step.label}</span>
            {step.suffix}
          </Wrapper>
        );
      })}
    </div>
  );
}
