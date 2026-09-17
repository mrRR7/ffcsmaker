import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Badge — mono chip for terms, scores, and `UNVERIFIED`-style flags.
 */
export interface FPBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "warn" | "danger";
  pill?: boolean;
}

const toneMap = {
  neutral: "text-fp-text-dim border-fp-border-default",
  accent: "text-fp-accent border-fp-border-accent",
  warn: "text-fp-warn border-fp-warn",
  danger: "text-fp-danger border-fp-danger"
} as const;

const toneWash = {
  neutral: undefined,
  accent: "var(--accent-wash)",
  warn: "var(--warn-wash)",
  danger: "var(--danger-wash)"
} as const;

export function FPBadge({ className, tone = "neutral", pill = false, style, ...props }: FPBadgeProps) {
  return (
    <span
      className={cn(
        "fp-label inline-flex items-center gap-1 border px-[10px] py-[5px] text-[var(--text-micro)]",
        pill ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        toneMap[tone],
        className
      )}
      style={{ backgroundColor: toneWash[tone], ...style }}
      {...props}
    />
  );
}
