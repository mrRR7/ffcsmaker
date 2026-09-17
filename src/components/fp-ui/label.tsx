import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Label — small metadata/status text. Defaults to the interface's normal
 * typographic voice (sans, normal case). Pass `variant="eyebrow"` only for
 * a genuine section kicker sitting directly above a heading — that's the
 * one place the old mono-uppercase-tracked treatment survives, and it
 * should stay rare.
 */
export interface FPLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "dim" | "accent" | "strong" | "warn";
  variant?: "text" | "eyebrow";
}

const toneMap = {
  dim: "text-fp-text-dim",
  accent: "text-fp-accent",
  strong: "text-fp-text-strong",
  warn: "text-fp-warn"
} as const;

export function FPLabel({ className, tone = "dim", variant = "text", ...props }: FPLabelProps) {
  return (
    <span
      className={cn(
        variant === "eyebrow" ? "fp-eyebrow" : "fp-text text-[var(--text-small)]",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}
