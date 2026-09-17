import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Badge — small status/metadata chip. No border by default; typography and
 * an optional tone wash carry the distinction. `tone="accent"` (green) is
 * reserved for genuinely meaningful states — a product-generated
 * recommendation ("Best overall", "Recommended"), not general information
 * (a semester pill, a constraint count). Pass `mono` only for a badge whose
 * content is an actual FFCS code or compact numeric value.
 */
export interface FPBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "warn" | "danger";
  pill?: boolean;
  mono?: boolean;
}

const toneMap = {
  neutral: "text-fp-text-dim",
  accent: "text-fp-accent",
  warn: "text-fp-warn",
  danger: "text-fp-danger"
} as const;

const toneWash = {
  neutral: undefined,
  accent: "var(--accent-wash)",
  warn: "var(--warn-wash)",
  danger: "var(--danger-wash)"
} as const;

export function FPBadge({ className, tone = "neutral", pill = false, mono = false, style, ...props }: FPBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-[10px] py-[5px] text-[var(--text-micro)]",
        mono ? "fp-code" : "fp-text",
        pill ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        toneMap[tone],
        className
      )}
      style={{ backgroundColor: toneWash[tone], ...style }}
      {...props}
    />
  );
}
