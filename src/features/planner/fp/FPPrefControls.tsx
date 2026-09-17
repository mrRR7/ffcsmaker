"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";

/**
 * Shared building blocks for FPPreferencesPane.
 * Kept local to features/planner/fp (not promoted to components/fp-ui) since
 * these are thin, section-specific compositions rather than standalone
 * reusable primitives.
 */

export const fpInputClass =
  "w-full rounded-[var(--radius-sm)] border border-transparent bg-fp-bg-inset px-2.5 py-[7px] text-[length:var(--text-small)] fp-text text-fp-text-body outline-none transition-colors focus:border-[var(--border-selected)] disabled:opacity-50";

export function FPFieldGroup({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FPLabel className="block">{label}</FPLabel>
      {children}
    </div>
  );
}
