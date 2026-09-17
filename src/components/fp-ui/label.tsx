import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Label — the signature mono uppercase micro-label. Pure text primitive used
 * for panel headers, step numbers, and metadata; not interactive.
 */
export interface FPLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "dim" | "accent" | "strong" | "warn";
}

const toneMap = {
  dim: "text-fp-text-dim",
  accent: "text-fp-accent",
  strong: "text-fp-text-strong",
  warn: "text-fp-warn"
} as const;

export function FPLabel({ className, tone = "dim", ...props }: FPLabelProps) {
  return <span className={cn("fp-label text-[var(--text-micro)]", toneMap[tone], className)} {...props} />;
}
