import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * MetricRun — values joined by the house `·` separator, e.g.
 * "Fri free · done by 15:00 · 1 gap · 0 clash".
 */
export interface FPMetricRunProps extends React.HTMLAttributes<HTMLSpanElement> {
  items: React.ReactNode[];
}

export function FPMetricRun({ items, className, ...props }: FPMetricRunProps) {
  return (
    <span className={cn("fp-label inline-flex flex-wrap items-center gap-1 text-[var(--text-micro)] text-fp-text-dim", className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </span>
  );
}
