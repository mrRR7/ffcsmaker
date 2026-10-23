import * as React from "react";
import { cn } from "@/utils/cn";
import { FPScrollRegion } from "@/components/fp-ui/scroll-region";

/**
 * SlotTable — hairline data table. Empty cell content defaults to an em dash.
 */
export interface FPSlotTableColumn<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

export interface FPSlotTableProps<T> {
  columns: FPSlotTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  className?: string;
  footer?: React.ReactNode;
  /** Names the scroll region for keyboard / screen-reader users. */
  label?: string;
}

export const FP_EMPTY_CELL = "—";

export function FPSlotTable<T>({ columns, rows, rowKey, className, footer, label = "Table" }: FPSlotTableProps<T>) {
  const gridTemplateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;
  return (
    // Scrolls sideways on narrow screens instead of clipping: at 320px five 1fr
    // columns were ~40px each and controls (the Swap select) were cut off.
    <FPScrollRegion
      label={label}
      className={cn("overflow-x-auto rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface", className)}
    >
      <div className="min-w-[36rem]">
      <div
        className="fp-text grid gap-4 border-b border-fp-border-default px-4 py-[11px] text-[length:var(--text-micro)] text-fp-text-dim"
        style={{ gridTemplateColumns }}
      >
        {columns.map((col) => (
          <span key={col.key} className={col.align === "right" ? "text-right" : undefined}>
            {col.header}
          </span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div
          key={rowKey(row, index)}
          className={cn(
            "grid items-center gap-4 px-4 py-[13px] text-[length:var(--text-small)]",
            index < rows.length - 1 && "border-b border-fp-border-default"
          )}
          style={{ gridTemplateColumns }}
        >
          {columns.map((col) => (
            <div key={col.key} className={col.align === "right" ? "text-right" : undefined}>
              {col.render(row) ?? FP_EMPTY_CELL}
            </div>
          ))}
        </div>
      ))}
      </div>
      {footer}
    </FPScrollRegion>
  );
}
