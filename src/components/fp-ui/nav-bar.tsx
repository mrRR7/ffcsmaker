import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * NavBar — top band: type wordmark + slots for a term pill / actions.
 * No logo exists in the source system; the wordmark is plain type.
 */
export interface FPNavBarProps extends React.HTMLAttributes<HTMLElement> {
  wordmark: React.ReactNode;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FPNavBar({ wordmark, nav, actions, className, ...props }: FPNavBarProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-5 border-b border-fp-border-default bg-fp-bg-surface px-6 py-3",
        className
      )}
      {...props}
    >
      <span className="font-fp-display text-[19px] font-bold tracking-[-0.01em] text-fp-text-strong">
        {wordmark}
      </span>
      {nav ? <nav className="fp-label flex items-center gap-[18px] text-[11px]">{nav}</nav> : null}
      {actions ? <div className="ml-auto flex items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}
