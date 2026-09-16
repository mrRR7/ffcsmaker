"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { BlockedWindow, DAYS, DayOfWeek } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 19;
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function windowCoversHour(win: BlockedWindow, day: DayOfWeek, hour: number) {
  if (win.day !== "All" && win.day !== day) return false;
  const start = timeToMinutes(win.startTime);
  const end = timeToMinutes(win.endTime);
  const cellStart = hour * 60;
  const cellEnd = cellStart + 60;
  return start < cellEnd && end > cellStart;
}

type DragState = { day: DayOfWeek; startHour: number; endHour: number };

/**
 * Blocked Windows — drag-paint a weekly busy-time grid. Existing windows show
 * as removable chips below the grid; there's no separate manual add/edit
 * form, since dragging already covers add and remove (drag over a busy cell
 * clears it).
 */
export function FPBlockedWindowsPanel() {
  const constraints = useAppStore((state) => state.constraints);
  const addBlockedWindow = useAppStore((state) => state.addBlockedWindow);
  const deleteBlockedWindow = useAppStore((state) => state.deleteBlockedWindow);
  const setConstraint = useAppStore((state) => state.setConstraint);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  function updateDrag(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  useEffect(() => {
    function onMouseUp() {
      const current = dragRef.current;
      if (!current) return;
      updateDrag(null);

      const lo = Math.min(current.startHour, current.endHour);
      const hi = Math.max(current.startHour, current.endHour);

      if (lo === hi) {
        const covering = constraints.blockedWindows.filter((win) =>
          windowCoversHour(win, current.day, lo)
        );
        if (covering.length > 0) {
          covering.forEach((win) => deleteBlockedWindow(win.id));
          return;
        }
      }

      addBlockedWindow({
        day: current.day,
        startTime: hourLabel(lo),
        endTime: hourLabel(hi + 1),
        label: "Busy"
      });
    }

    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [constraints.blockedWindows, addBlockedWindow, deleteBlockedWindow]);

  const blockedCount = constraints.blockedWindows.length;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-surface select-none">
        <div className="flex flex-wrap items-center gap-3 border-b border-fp-border-default px-4 py-[13px]">
          <span className="font-fp-display text-[15px] font-bold text-fp-text-strong">
            Times you&apos;re busy
          </span>
          <span className="text-[13px] text-fp-text-dim">
            Drag over the grid &mdash; class, club, gym, commute
          </span>
          <FPLabel tone="accent" className="ml-auto">
            {blockedCount} blocked
          </FPLabel>
        </div>

        <div
          className="px-4 py-3.5"
          onMouseLeave={() => {
            if (dragRef.current) updateDrag(null);
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `46px repeat(${DAYS.length}, minmax(0, 1fr))`,
              rowGap: 3,
              columnGap: 3
            }}
          >
            <div />
            {DAYS.map((day) => (
              <div key={day} className="fp-label pb-1.5 text-center text-[10px] text-fp-text-dim">
                {day.slice(0, 3)}
              </div>
            ))}
            {HOURS.map((hour) => (
              <React.Fragment key={hour}>
                <div className="fp-label flex items-center justify-end pr-2 text-[10px] text-fp-text-dim">
                  {hourLabel(hour)}
                </div>
                {DAYS.map((day) => {
                  const covering = constraints.blockedWindows.filter((win) =>
                    windowCoversHour(win, day, hour)
                  );
                  const isBusy = covering.length > 0;
                  const inPreview =
                    drag &&
                    drag.day === day &&
                    hour >= Math.min(drag.startHour, drag.endHour) &&
                    hour <= Math.max(drag.startHour, drag.endHour);
                  return (
                    <div
                      key={day}
                      onMouseDown={() => updateDrag({ day, startHour: hour, endHour: hour })}
                      onMouseEnter={() => {
                        if (dragRef.current && dragRef.current.day === day) {
                          updateDrag({ ...dragRef.current, endHour: hour });
                        }
                      }}
                      title={covering[0]?.label || undefined}
                      className={cn(
                        "h-[22px] cursor-pointer rounded-[3px] transition-colors",
                        isBusy || inPreview
                          ? "bg-fp-busy"
                          : "bg-fp-bg-inset hover:bg-fp-bg-raised"
                      )}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="fp-label flex items-center gap-4 border-t border-fp-border-default px-4 py-[11px] text-[10px] text-fp-text-dim">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-fp-busy" /> Busy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-fp-border-default bg-fp-bg-inset" /> Free
          </span>
          <button
            type="button"
            className="ml-auto text-fp-accent hover:underline"
            onClick={() => setConstraint("blockedWindows", [])}
            disabled={blockedCount === 0}
          >
            Clear all
          </button>
        </div>
      </div>

      {constraints.blockedWindows.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {constraints.blockedWindows.map((win) => (
            <span
              key={win.id}
              className="fp-label inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-fp-border-default bg-fp-bg-surface py-1.5 pl-3 pr-1.5 text-[11px] text-fp-text-body"
            >
              {win.label || "Busy"} &middot; {win.day === "All" ? "All days" : win.day.slice(0, 3)} &middot; {win.startTime}
              &ndash;{win.endTime}
              <button
                type="button"
                onClick={() => deleteBlockedWindow(win.id)}
                aria-label="Remove blocked window"
                className="flex h-4 w-4 items-center justify-center text-fp-text-dim hover:text-fp-danger"
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-fp-text-dim">No busy times yet &mdash; drag over the grid above to add some.</p>
      )}
    </div>
  );
}
