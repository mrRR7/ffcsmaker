"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { BlockedWindow, DAYS, DayOfWeek } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";
import { FPButton } from "@/components/fp-ui/button";
import { fpInputClass, fpSelectClass } from "./FPPrefControls";

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
 * Section 4 — Blocked Windows. Primary interaction is the drag-paint busy-time
 * grid from the mockup; underneath it, the classic app's label/day/time
 * add-row form and editable list are preserved verbatim (same store actions)
 * so no capability from ConstraintPanel.tsx's Blocked Windows section is lost.
 */
export function FPBlockedWindowsPanel() {
  const constraints = useAppStore((state) => state.constraints);
  const addBlockedWindow = useAppStore((state) => state.addBlockedWindow);
  const updateBlockedWindow = useAppStore((state) => state.updateBlockedWindow);
  const deleteBlockedWindow = useAppStore((state) => state.deleteBlockedWindow);
  const setConstraint = useAppStore((state) => state.setConstraint);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [draft, setDraft] = useState<Omit<BlockedWindow, "id">>({
    day: "All",
    startTime: "12:30",
    endTime: "13:30",
    label: ""
  });

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

  function submitBlockedWindow() {
    addBlockedWindow(draft);
    setDraft({ day: "All", startTime: "12:30", endTime: "13:30", label: "" });
  }

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

      <div className="space-y-3">
        <FPLabel className="block">Labeled windows</FPLabel>
        <div className="grid gap-2 md:grid-cols-[1fr_130px_130px_130px_40px]">
          <input
            className={fpInputClass}
            value={draft.label ?? ""}
            placeholder="label"
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          />
          <select
            className={fpSelectClass}
            value={draft.day}
            onChange={(event) =>
              setDraft((current) => ({ ...current, day: event.target.value as BlockedWindow["day"] }))
            }
          >
            <option value="All">all</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day.toLowerCase()}
              </option>
            ))}
          </select>
          <input
            type="time"
            className={fpInputClass}
            value={draft.startTime}
            onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))}
          />
          <input
            type="time"
            className={fpInputClass}
            value={draft.endTime}
            onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))}
          />
          <FPButton variant="secondary" size="sm" className="justify-center px-0" onClick={submitBlockedWindow}>
            +
          </FPButton>
        </div>

        {constraints.blockedWindows.length > 0 ? (
          <div className="space-y-2">
            {constraints.blockedWindows.map((win) => (
              <div
                key={win.id}
                className="grid gap-2 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-2.5 md:grid-cols-[1fr_130px_130px_130px_40px]"
              >
                <input
                  className={fpInputClass}
                  value={win.label ?? ""}
                  onChange={(event) => updateBlockedWindow(win.id, { label: event.target.value })}
                />
                <select
                  className={fpSelectClass}
                  value={win.day}
                  onChange={(event) =>
                    updateBlockedWindow(win.id, { day: event.target.value as BlockedWindow["day"] })
                  }
                >
                  <option value="All">all</option>
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day.toLowerCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  className={fpInputClass}
                  value={win.startTime}
                  onChange={(event) => updateBlockedWindow(win.id, { startTime: event.target.value })}
                />
                <input
                  type="time"
                  className={fpInputClass}
                  value={win.endTime}
                  onChange={(event) => updateBlockedWindow(win.id, { endTime: event.target.value })}
                />
                <FPButton
                  variant="ghost"
                  size="sm"
                  className="justify-center px-0 text-fp-danger hover:text-fp-danger"
                  onClick={() => deleteBlockedWindow(win.id)}
                >
                  &times;
                </FPButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-fp-text-dim">No labeled windows yet &mdash; paint the grid above or add one here.</p>
        )}
      </div>
    </div>
  );
}
