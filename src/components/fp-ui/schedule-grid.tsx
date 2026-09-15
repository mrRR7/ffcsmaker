import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * ScheduleGrid — generic weekly/period matrix shell: a mono row-label gutter
 * plus N data columns, laid out as CSS grid. Orientation-agnostic (callers
 * decide whether rows are times/days or columns are days/periods) so it can
 * back both the simplified weekly preview grids and the real THEORY/LAB
 * matrices from timetableMatrix.ts. Empty cells should use bg-fp-bg-inset.
 */
export interface FPScheduleGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columnHeaders: React.ReactNode[];
  rowLabelWidth?: number;
  gap?: number;
}

export function FPScheduleGrid({
  columnHeaders,
  rowLabelWidth = 48,
  gap = 2,
  className,
  style,
  children,
  ...props
}: FPScheduleGridProps) {
  return (
    <div
      className={cn("bg-fp-bg-inset rounded-[var(--radius-md)] p-0.5", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `${rowLabelWidth}px repeat(${columnHeaders.length}, minmax(0, 1fr))`,
        gap,
        ...style
      }}
      {...props}
    >
      <div />
      {columnHeaders.map((header, index) => (
        <div
          key={index}
          className="fp-label px-1.5 py-1.5 text-center text-[11px] text-fp-text-dim"
        >
          {header}
        </div>
      ))}
      {children}
    </div>
  );
}

export function FPScheduleRowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="fp-label flex items-start justify-end px-2 py-1 text-[11px] text-fp-text-dim">
      {children}
    </div>
  );
}

export function FPScheduleLunchRow({
  span,
  label = "Lunch"
}: {
  span: number;
  label?: string;
}) {
  return (
    <div
      className="fp-label bg-fp-bg-inset px-2.5 py-1 text-right text-[11px] text-fp-text-dim"
      style={{ gridColumn: `1 / span ${span}` }}
    >
      {label}
    </div>
  );
}
