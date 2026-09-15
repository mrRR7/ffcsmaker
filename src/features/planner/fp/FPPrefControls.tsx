"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { FPCheckbox } from "@/components/fp-ui/checkbox";
import { FPLabel } from "@/components/fp-ui/label";

/**
 * Shared building blocks for FPPreferencesPane's four constraint sections.
 * Kept local to features/planner/fp (not promoted to components/fp-ui) since
 * these are thin, section-specific compositions rather than standalone
 * reusable primitives.
 */

export const fpInputClass =
  "w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-[7px] text-[13px] font-fp-mono text-fp-text-body outline-none transition-colors focus:border-fp-accent disabled:opacity-50";

export const fpSelectClass = cn(fpInputClass, "appearance-none");

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

/** Boolean constraint row — checkbox + verbatim snake_case key + description. */
export function FPToggleRow({
  checked,
  snakeLabel,
  description,
  onToggle,
  trailing
}: {
  checked: boolean;
  snakeLabel: string;
  description: string;
  onToggle: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-md)] border px-4 py-[14px]",
        checked ? "border-fp-border-accent" : "border-fp-border-default"
      )}
      style={checked ? { backgroundColor: "var(--accent-wash)" } : undefined}
    >
      <FPCheckbox checked={checked} onCheckedChange={onToggle} />
      <div className="min-w-0">
        <div
          className={cn(
            "font-fp-mono text-[13px]",
            checked ? "text-fp-text-strong" : "text-fp-text-dim"
          )}
        >
          {snakeLabel}
        </div>
        <div className="text-[12px] text-fp-text-dim">{description}</div>
      </div>
      {trailing ? (
        <span className="fp-label ml-auto shrink-0 text-[11px] text-fp-text-dim">{trailing}</span>
      ) : null}
    </div>
  );
}

/** Numeric constraint row — no boolean state, trailing value box instead of a checkbox. */
export function FPNumberFieldRow({
  snakeLabel,
  description,
  value,
  onChange,
  min,
  placeholder = "any"
}: {
  snakeLabel: string;
  description: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-fp-border-default px-4 py-[14px]">
      <div className="h-5 w-5 flex-none" aria-hidden="true" />
      <div className="min-w-0">
        <div className="font-fp-mono text-[13px] text-fp-text-dim">{snakeLabel}</div>
        <div className="text-[12px] text-fp-text-dim">{description}</div>
      </div>
      <input
        type="number"
        min={min}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        className="ml-auto w-[84px] flex-none rounded-[var(--radius-sm)] border border-fp-border-strong bg-fp-bg-inset px-2.5 py-[6px] text-right text-[13px] font-fp-mono text-fp-text-body outline-none transition-colors hover:border-fp-text-dim focus:border-fp-accent"
      />
    </div>
  );
}

export type FPPrefSectionId = "time-preferences" | "time-limits" | "early-finish" | "blocked-windows";

export function FPSectionTabs({
  sections,
  active,
  onChange
}: {
  sections: { id: FPPrefSectionId; label: string }[];
  active: FPPrefSectionId;
  onChange: (id: FPPrefSectionId) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-fp-border-default">
      {sections.map((section, index) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={cn(
              "fp-label -mb-px border-b-2 px-4 py-[10px] text-[11px] transition-colors",
              isActive
                ? "border-fp-accent text-fp-text-strong"
                : "border-transparent text-fp-text-dim hover:text-fp-text-body"
            )}
          >
            {String(index + 1).padStart(2, "0")} {section.label}
          </button>
        );
      })}
    </div>
  );
}
