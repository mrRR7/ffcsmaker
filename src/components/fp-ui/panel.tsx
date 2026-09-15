import * as React from "react";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";

/**
 * Panel — a labelled region / outer app band. Hairline border, flat surface,
 * optional mono-uppercase title in the header row.
 */
export interface FPPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export function FPPanel({ title, action, className, children, ...props }: FPPanelProps) {
  return (
    <div
      className={cn("rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface overflow-hidden", className)}
      {...props}
    >
      {title || action ? (
        <div className="flex items-center gap-3 border-b border-fp-border-default px-4 py-3">
          {typeof title === "string" ? <FPLabel>{title}</FPLabel> : title}
          {action ? <div className="ml-auto flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
