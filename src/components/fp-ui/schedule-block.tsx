import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * ScheduleBlock — one grid cell. `color`/`textColor` take the course's own
 * configured hex color (the app lets students pick a color per course; we
 * preserve that functional per-course color-coding rather than forcing the
 * single-hue "depth" family the mockups use for their placeholder data —
 * courses still read by their mono code, not by hue alone). `depth` (1-4) is
 * available for illustrative/preview grids that don't carry real course
 * colors (e.g. the landing page's sample week). `gap` renders the dashed
 * warn-bordered "Gap" treatment; omit both `color` and `depth` for an empty
 * (bg-inset) cell.
 */
export interface FPScheduleBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  textColor?: string;
  depth?: 1 | 2 | 3 | 4;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  gap?: boolean;
  lunch?: boolean;
  minHeight?: number;
}

const depthVar: Record<1 | 2 | 3 | 4, string> = {
  1: "var(--block-1)",
  2: "var(--block-2)",
  3: "var(--block-3)",
  4: "var(--block-4)"
};

export function FPScheduleBlock({
  color,
  textColor,
  depth,
  label,
  sublabel,
  gap = false,
  lunch = false,
  minHeight = 34,
  className,
  style,
  ...props
}: FPScheduleBlockProps) {
  if (lunch) {
    return <div className={cn("bg-fp-bg-inset", className)} style={{ minHeight, ...style }} {...props} />;
  }

  if (gap) {
    return (
      <div
        className={cn(
          "fp-label flex items-center px-2 text-[11px] text-fp-warn border border-dashed border-fp-warn bg-fp-bg-page",
          className
        )}
        style={{ minHeight, ...style }}
        {...props}
      >
        Gap
      </div>
    );
  }

  const bg = color ?? (depth ? depthVar[depth] : undefined);
  if (!bg) {
    return <div className={cn("bg-fp-bg-page", className)} style={{ minHeight, ...style }} {...props} />;
  }

  return (
    <div
      className={cn("font-fp-mono px-2 py-1 text-[11px] tracking-[0.02em] overflow-hidden", className)}
      style={{ minHeight, background: bg, color: textColor ?? "#0b0e11", ...style }}
      {...props}
    >
      <div className="truncate">{label}</div>
      {sublabel ? <div className="truncate opacity-75">{sublabel}</div> : null}
    </div>
  );
}
