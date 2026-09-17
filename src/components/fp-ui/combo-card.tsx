import * as React from "react";
import { cn } from "@/utils/cn";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";

/**
 * ComboCard — a ranked solution: outcome label, score, optional metric run /
 * thumbnail / action slot. Used by Results' combo row, Compare, and Saved.
 */
export interface FPComboCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  selected?: boolean;
  eyebrow: React.ReactNode;
  score: React.ReactNode;
  title?: React.ReactNode;
  meta?: React.ReactNode;
  thumbnail?: React.ReactNode;
  footer?: React.ReactNode;
}

export function FPComboCard({
  selected,
  eyebrow,
  score,
  title,
  meta,
  thumbnail,
  footer,
  className,
  ...props
}: FPComboCardProps) {
  return (
    <FPCard selected={selected} padding="md" className={cn("flex flex-col gap-2", className)} {...props}>
      {thumbnail}
      <div className="flex items-baseline gap-2.5">
        <FPLabel tone={selected ? "strong" : "dim"}>{eyebrow}</FPLabel>
        <span className="ml-auto font-fp-mono text-[length:var(--text-h)] text-fp-text-strong">
          {score}
        </span>
      </div>
      {title ? <div className="font-fp-display text-[length:var(--text-body-size)] font-bold text-fp-text-strong">{title}</div> : null}
      {meta ? <FPLabel className="block">{meta}</FPLabel> : null}
      {footer}
    </FPCard>
  );
}
