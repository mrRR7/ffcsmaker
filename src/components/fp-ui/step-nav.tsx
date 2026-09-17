import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * StepNav — plain-text step tabs ("Courses / Preferences"). No number
 * prefix (that was decoration reinforcing a retired terminal motif) and no
 * accent-colored active state — "you are here" is a neutral surface, not
 * a green one.
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
              "fp-text flex flex-1 items-center gap-2 px-5 py-3 text-[length:var(--text-small)] text-left transition-colors",
              index < steps.length - 1 && "border-r border-fp-border-default",
              isActive
                ? "text-fp-text-strong font-medium"
                : step.disabled
                  ? "cursor-not-allowed text-fp-text-dim opacity-40"
                  : isClickable
                    ? "cursor-pointer text-fp-text-dim hover:text-fp-text-body"
                    : "text-fp-text-dim"
            )}
            style={isActive ? { backgroundColor: "var(--surface-selected)" } : undefined}
          >
            {isDone ? <Check className="h-3.5 w-3.5 text-fp-accent" strokeWidth={1.5} /> : null}
            <span>{step.label}</span>
            {step.suffix}
          </Wrapper>
        );
      })}
    </div>
  );
}
