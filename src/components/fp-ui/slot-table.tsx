import * as React from "react";
import { cn } from "@/utils/cn";

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
}

export const FP_EMPTY_CELL = "—";

export function FPSlotTable<T>({ columns, rows, rowKey, className, footer }: FPSlotTableProps<T>) {
  const gridTemplateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface", className)}>
      <div
        className="fp-label grid gap-4 border-b border-fp-border-default px-4 py-[11px] text-[var(--text-micro)] text-fp-text-dim"
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
            "grid items-center gap-4 px-4 py-[13px] text-[var(--text-small)]",
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
      {footer}
    </div>
  );
}
