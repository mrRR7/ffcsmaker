"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { SavedSchedule, Course, TimeSlot } from "@/engine/types";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { getScheduleDayBlocks } from "./scheduleVisuals";

export function SavedWeekCard({
  saved,
  slots,
  courses,
  isStale,
  staleCourseCode,
  unverifiedCourseCode,
  onToggleFavorite,
  onRename,
  onDelete,
  onReopen,
  onRerun
}: {
  saved: SavedSchedule;
  slots: TimeSlot[];
  courses: Course[];
  isStale: boolean;
  staleCourseCode: string | null;
  unverifiedCourseCode: string | null;
  onToggleFavorite: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onReopen: () => void;
  onRerun: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(saved.name);

  const schedule = saved.timetable;
  const { days, blocksByDay } = getScheduleDayBlocks(schedule, slots, courses);
  const totalCredits = schedule.selections.reduce((sum, selection) => sum + selection.credits, 0);
  const freeDayCount = blocksByDay.filter((blocks) => blocks.length === 0).length;
  const slotCodes = schedule.selections.map((selection) => selection.displaySlots.join("+")).join(" · ");

  function commitRename() {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== saved.name) {
      onRename(trimmed);
    } else {
      setDraftName(saved.name);
    }
  }

  function copySlots() {
    navigator.clipboard
      .writeText(slotCodes)
      .then(() => toast.success("Slot codes copied."))
      .catch(() => toast.error("Could not copy slot codes."));
  }

  return (
    <article
      className="grid items-center gap-5 rounded-[var(--radius-lg)] border p-[18px]"
      style={{
        gridTemplateColumns: "132px minmax(0,1fr) auto",
        borderColor: saved.favorite ? "var(--border-accent)" : "var(--border-default)",
        backgroundColor: saved.favorite ? "var(--accent-wash)" : "var(--bg-surface)"
      }}
    >
      <div
        className="grid gap-[2px] rounded-[4px] bg-fp-bg-inset p-2"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day, index) => (
          <div key={day} className="flex flex-col gap-[2px]">
            {blocksByDay[index]!.length === 0 ? (
              <div className="min-h-[8px] rounded-[2px] bg-fp-bg-page" />
            ) : (
              blocksByDay[index]!.map((block) => (
                <div key={block.id} className="min-h-[8px] rounded-[2px]" style={{ background: block.color }} />
              ))
            )}
          </div>
        ))}
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={onToggleFavorite}
          className="fp-label mr-2 text-[11px]"
          style={{ color: saved.favorite ? "var(--accent)" : "var(--text-dim)" }}
        >
          {saved.favorite ? "First choice" : "Backup"}
        </button>
        <FPLabel className="inline">Saved {formatDistanceToNow(new Date(saved.updatedAt), { addSuffix: true })}</FPLabel>

        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") {
                setDraftName(saved.name);
                setEditing(false);
              }
            }}
            className="mt-1 block w-full border-b border-fp-border-accent bg-transparent font-fp-display text-[19px] font-bold text-fp-text-strong outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Click to rename"
            className="mt-1 block truncate text-left font-fp-display text-[19px] font-bold text-fp-text-strong hover:opacity-80"
          >
            {saved.name}
          </button>
        )}

        <FPLabel className="mt-1 block">
          {schedule.selections.length} courses &middot; {totalCredits} credits &middot;{" "}
          {freeDayCount > 0 ? `${freeDayCount} free day${freeDayCount === 1 ? "" : "s"}` : "no free day"} &middot;{" "}
          {schedule.metrics.totalGapSlots} gap{schedule.metrics.totalGapSlots === 1 ? "" : "s"} &middot;{" "}
          {unverifiedCourseCode ? "1 unverified professor" : "all verified"}
        </FPLabel>
        <FPLabel className="mt-1 block truncate font-fp-mono">{slotCodes}</FPLabel>

        {isStale ? (
          <FPNote className="mt-2">
            Built before you added {staleCourseCode} &mdash; re-run to check it still holds.
          </FPNote>
        ) : unverifiedCourseCode ? (
          <FPNote tone="warn" className="mt-2">
            1 unverified professor &mdash; {unverifiedCourseCode} data came from a student, not the catalog.
          </FPNote>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-2.5">
        <span
          className="font-fp-mono text-[24px]"
          style={{ color: saved.favorite ? "var(--accent)" : "var(--text-strong)" }}
        >
          {schedule.score}
        </span>
        <div className="flex gap-2">
          {isStale ? (
            <FPButton variant="secondary" size="sm" onClick={onRerun}>
              Re-run
            </FPButton>
          ) : (
            <FPButton variant="secondary" size="sm" onClick={copySlots}>
              Copy slots
            </FPButton>
          )}
          <FPButton variant="primary" size="sm" onClick={onReopen}>
            Open
          </FPButton>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="fp-label text-[11px] text-fp-text-dim hover:text-fp-danger"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
