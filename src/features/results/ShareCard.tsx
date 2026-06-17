"use client";

import type { CSSProperties } from "react";
import {
  CAMPUS_LABELS,
  Campus,
  ScoredTimetable,
  TimeSlot
} from "@/engine/types";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { parseTime } from "@/engine/conflict";

// Fixed export dimensions — single unified design
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

type Props = {
  id: string;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  campus: Campus;
  semesterLabel: string;
};

// Build a simple day→time→courseCode lookup from the schedule + slot catalog
function buildGrid(schedule: ScoredTimetable, slots: TimeSlot[]) {
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const courseBySlotId = new Map<string, { code: string; color: string; name: string }>();

  // Assign each course a color from the course.color field or a fallback palette
  const palette = [
    "#14b8a6", "#6366f1", "#22c55e", "#f59e0b",
    "#ec4899", "#38bdf8", "#a78bfa", "#f97316"
  ];

  schedule.selections.forEach((sel, idx) => {
    const color = palette[idx % palette.length];
    const allIds = [
      ...sel.theorySlotIds,
      ...sel.labSlotIds,
      ...sel.combinedSlotIds
    ];
    allIds.forEach((id) => {
      courseBySlotId.set(id, { code: sel.courseCode, color, name: sel.courseName });
    });
  });

  // Collect unique days (in catalog order) and time bands (unique start+end combos)
  const days = getSlotDaysForSlots(slots);
  const usedSlots = slots.filter((s) => courseBySlotId.has(s.id));

  // Unique time bands sorted by start time
  const timeBandMap = new Map<string, { start: string; end: string }>();
  usedSlots.forEach((s) => {
    const key = `${s.startTime}-${s.endTime}`;
    timeBandMap.set(key, { start: s.startTime, end: s.endTime });
  });
  const timeBands = Array.from(timeBandMap.values()).sort(
    (a, b) => parseTime(a.start) - parseTime(b.start)
  );

  // Build rows: one per time band, columns per day
  type Cell = { code: string; color: string; name: string } | null;
  const rows: Cell[][] = timeBands.map(({ start, end }) =>
    days.map((day) => {
      const slot = slots.find(
        (s) => s.day === day && s.startTime === start && s.endTime === end
      );
      if (!slot) return null;
      return courseBySlotId.get(slot.id) ?? null;
    })
  );

  return { days, timeBands, rows };
}

export function ShareCard({ id, schedule, slots, campus, semesterLabel }: Props) {
  const totalCredits = schedule.selections.reduce((s, sel) => s + sel.credits, 0);
  const { days, timeBands, rows } = buildGrid(schedule, slots);

  // Compact time label: "08:30"
  function fmt(t: string) {
    return t.slice(0, 5);
  }

  const PAD = 48;
  const HEADER_H = 80;
  const LEGEND_H = 56;
  const FOOTER_H = 40;
  const GRID_H = SHARE_CARD_HEIGHT - PAD * 2 - HEADER_H - LEGEND_H - FOOTER_H - 24;
  const TIME_COL_W = 68;
  const gridW = SHARE_CARD_WIDTH - PAD * 2 - TIME_COL_W;
  const colW = Math.floor(gridW / Math.max(days.length, 1));
  const rowH = Math.floor(GRID_H / Math.max(timeBands.length + 1, 1)); // +1 for header row

  const root: CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    zIndex: -9999,
    pointerEvents: "none",
    overflow: "hidden",
    background: "#080b14",
    color: "#f1f5f9",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
    padding: PAD
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const headerRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: HEADER_H,
    marginBottom: 20
  };

  const logoText: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#38bdf8",
    opacity: 0.9
  };

  const titleBlock: CSSProperties = { lineHeight: 1.15 };
  const titleText: CSSProperties = { fontSize: 28, fontWeight: 800, margin: 0 };
  const subtitleText: CSSProperties = { fontSize: 13, color: "#94a3b8", marginTop: 4 };

  const campusBadge: CSSProperties = {
    border: "1px solid rgba(56,189,248,0.35)",
    borderRadius: 9999,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#7dd3fc",
    background: "rgba(56,189,248,0.08)"
  };

  // ── Grid ─────────────────────────────────────────────────────────────────
  const gridContainer: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${TIME_COL_W}px repeat(${days.length}, ${colW}px)`,
    gap: 2
  };

  const dayHeaderCell: CSSProperties = {
    height: rowH,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b"
  };

  const timeCell: CSSProperties = {
    height: rowH,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
    fontSize: 10,
    fontWeight: 600,
    color: "#475569"
  };

  function emptyCell(key: string): CSSProperties {
    return {
      height: rowH,
      background: "rgba(255,255,255,0.03)",
      borderRadius: 4
    };
  }

  function courseCell(color: string): CSSProperties {
    return {
      height: rowH,
      background: color,
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    };
  }

  const courseCellText: CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.03em",
    textAlign: "center",
    lineHeight: 1.1,
    padding: "0 4px"
  };

  // ── Legend ───────────────────────────────────────────────────────────────
  const legendRow: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    height: LEGEND_H,
    alignItems: "center",
    overflow: "hidden"
  };

  const legendItem: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 9999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    color: "#cbd5e1",
    maxWidth: 180,
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis"
  };

  // ── Footer ───────────────────────────────────────────────────────────────
  const footer: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    height: FOOTER_H
  };

  const footerBrand: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  };

  const scoreBadge: CSSProperties = {
    background: "#1d4ed8",
    borderRadius: 9999,
    padding: "5px 14px",
    fontSize: 12,
    fontWeight: 800,
    color: "#ffffff"
  };

  const palette = [
    "#14b8a6", "#6366f1", "#22c55e", "#f59e0b",
    "#ec4899", "#38bdf8", "#a78bfa", "#f97316"
  ];

  return (
    <div id={id} style={root}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <div style={logoText}>Ultimate FFCS Planner</div>
          <div style={titleBlock}>
            <p style={titleText}>My FFCS Timetable</p>
            <p style={subtitleText}>{semesterLabel} · {totalCredits} credits</p>
          </div>
        </div>
        <div style={campusBadge}>{CAMPUS_LABELS[campus]}</div>
      </div>

      {/* Timetable grid */}
      <div style={gridContainer}>
        {/* Top-left corner */}
        <div style={dayHeaderCell} />
        {/* Day headers */}
        {days.map((day) => (
          <div key={day} style={dayHeaderCell}>
            {day.slice(0, 3).toUpperCase()}
          </div>
        ))}

        {/* Data rows */}
        {timeBands.map(({ start, end }, rowIdx) => (
          <>{/* React fragment — RowFragment pattern avoids extra DOM nodes */}
            {/* Time label */}
            <div key={`time-${rowIdx}`} style={timeCell}>{fmt(start)}</div>
            {/* Day cells */}
            {rows[rowIdx].map((cell, colIdx) => (
              cell ? (
                <div key={`cell-${rowIdx}-${colIdx}`} style={courseCell(cell.color)}>
                  <span style={courseCellText}>{cell.code}</span>
                </div>
              ) : (
                <div key={`empty-${rowIdx}-${colIdx}`} style={emptyCell(`${rowIdx}-${colIdx}`)} />
              )
            ))}
          </>
        ))}
      </div>

      {/* Legend */}
      <div style={legendRow}>
        {schedule.selections.map((sel, idx) => (
          <div key={sel.courseId} style={legendItem}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: palette[idx % palette.length],
              flexShrink: 0
            }} />
            {sel.courseCode}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={footer}>
        <div style={footerBrand}>ffcinator</div>
        <div style={scoreBadge}>Score {Math.round(schedule.score)}</div>
      </div>
    </div>
  );
}
