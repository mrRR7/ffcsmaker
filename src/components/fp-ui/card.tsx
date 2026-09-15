import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Card — flat hairline surface. No shadow, ever; depth comes from value steps.
 * `selected` = 1px accent border + accent-wash fill, used identically for a
 * selected combo card and a checked constraint.
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
        "rounded-[var(--radius-lg)] border bg-fp-bg-surface",
        selected ? "border-fp-border-accent" : "border-fp-border-default",
        onClick && "cursor-pointer transition-transform duration-150 active:scale-[0.98]",
        paddingMap[padding],
        className
      )}
      style={selected ? { backgroundColor: "var(--accent-wash)" } : undefined}
      {...props}
    />
  )
);
FPCard.displayName = "FPCard";
