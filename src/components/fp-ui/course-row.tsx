import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * CourseRow — rail entry with a 2px accent LEFT bar. The system's one
 * deliberate left-border-accent use. `tone="warn"` swaps the bar to warn for
 * under-optioned / at-risk courses.
 */
export interface FPCourseRowProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "accent" | "warn";
}

export function FPCourseRow({ className, tone = "default", ...props }: FPCourseRowProps) {
  return (
    <div
      className={cn(
        "border-y border-r rounded-r-[var(--radius-sm)] border-fp-border-default bg-fp-bg-surface px-4 py-3",
        tone === "default" && "border-l-2 border-l-fp-border-default",
        tone === "accent" && "border-l-2 border-l-fp-accent",
        tone === "warn" && "border-l-2 border-l-fp-warn",
        className
      )}
      style={tone === "warn" ? { backgroundColor: "var(--warn-wash)" } : undefined}
      {...props}
    />
  );
}
