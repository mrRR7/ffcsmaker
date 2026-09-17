import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Card — flat surface. No border by default; the existing --shadow-raised
 * inset highlight (not a boxed rectangle) supplies enough depth on its own.
 * `selected` = neutral --surface-selected background + neutral
 * --border-selected — never accent green, since selection isn't the same
 * signal as a meaningful action or recommendation.
 */
export interface FPCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-[9px]",
  md: "p-4",
  lg: "p-5"
} as const;

export const FPCard = React.forwardRef<HTMLDivElement, FPCardProps>(
  ({ className, selected, padding = "md", onClick, ...props }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] bg-fp-bg-surface",
        selected ? "border border-[var(--border-selected)]" : "border border-transparent",
        onClick && "cursor-pointer transition-transform duration-[var(--dur-fast)] active:scale-[0.98]",
        paddingMap[padding],
        className
      )}
      style={{
        boxShadow: "var(--shadow-raised)",
        ...(selected ? { backgroundColor: "var(--surface-selected)" } : null)
      }}
      {...props}
    />
  )
);
FPCard.displayName = "FPCard";
