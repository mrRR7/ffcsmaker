"use client";

import { Fragment, type CSSProperties } from "react";
import {
  CAMPUS_LABELS,
  Campus,
  Course,
  ScoredTimetable,
  TimeSlot
} from "@/engine/types";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { parseTime } from "@/engine/conflict";
import { colorForIndex } from "@/lib/coursePalette";
import { readableTextColor } from "@/components/fp-ui/slot-matrix-timetable";

// Fixed export dimensions — single unified design
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

// The card is captured to a PNG, so it uses the dark skin's literal values
// rather than CSS variables. Keep in sync with src/app/fp-tokens.css (dark).
const INK = "#e6edea";
const INK_STRONG = "#f2f7f4";
const MUTED = "#7e8b90";
const GROUND = "#0b0e11";
const SURFACE = "#141a1f";
const INSET = "#0e1317";
const RULE = "#2a343b";

type Props = {
  id: string;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  campus: Campus;
  semesterLabel: string;
};

// Build a simple day→time→courseCode lookup from the schedule + slot catalog
function buildGrid(schedule: ScoredTimetable, slots: TimeSlot[], courses: Course[]) {
  const courseBySlotId = new Map<string, { code: string; color: string; name: string }>();

  schedule.selections.forEach((sel, idx) => {
    // Use the course's own color so the image matches what the user sees in the app.
    const color = courses.find((course) => course.id === sel.courseId)?.color ?? colorForIndex(idx);
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

export function ShareCard({ id, schedule, slots, courses, campus, semesterLabel }: Props) {
  const totalCredits = schedule.selections.reduce((s, sel) => s + sel.credits, 0);
  const facultyRows = schedule.selections.map((selection) => ({
    courseCode: selection.courseCode,
    professorName: selection.professorName
  }));
  const { days, timeBands, rows } = buildGrid(schedule, slots, courses);

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
    background: GROUND,
    color: INK,
    fontFamily: "var(--font-body), 'IBM Plex Sans', system-ui, sans-serif",
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

  const titleBlock: CSSProperties = { lineHeight: 1.15, marginTop: 10 };
  const titleText: CSSProperties = {
    fontFamily: "var(--font-display), 'Space Grotesk', system-ui, sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: INK_STRONG,
    margin: 0
  };
  const subtitleText: CSSProperties = { fontSize: 13, color: MUTED, marginTop: 4 };

  const campusBadge: CSSProperties = {
    border: `1px solid ${RULE}`,
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: INK,
    background: SURFACE
  };

  const monoFont = "var(--font-mono), 'IBM Plex Mono', ui-monospace, monospace";

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
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: 500,
    color: MUTED
  };

  const timeCell: CSSProperties = {
    height: rowH,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
    fontFamily: monoFont,
    fontSize: 10,
    color: MUTED
  };

  const emptyCell: CSSProperties = {
    height: rowH,
    background: INSET,
    borderRadius: 4
  };

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

  function courseCellText(color: string): CSSProperties {
    return {
      fontFamily: monoFont,
      fontSize: 11,
      fontWeight: 500,
      color: readableTextColor(color),
      textAlign: "center",
      lineHeight: 1.1,
      padding: "0 4px"
    };
  }

  return (
    <div id={id} style={root}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-reversed.svg" alt="Ultimate FFCS" height={28} style={{ height: 28, width: "auto", display: "block" }} />
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
        {timeBands.map(({ start }, rowIdx) => (
          <Fragment key={`row-${rowIdx}`}>
            <div style={timeCell}>{fmt(start)}</div>
            {rows[rowIdx].map((cell, colIdx) =>
              cell ? (
                <div key={`cell-${rowIdx}-${colIdx}`} style={courseCell(cell.color)}>
                  <span style={courseCellText(cell.color)}>{cell.code}</span>
                </div>
              ) : (
                <div key={`empty-${rowIdx}-${colIdx}`} style={emptyCell} />
              )
            )}
          </Fragment>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginTop: 16
        }}
      >
        {facultyRows.map((faculty) => (
          <div
            key={faculty.courseCode}
            style={{
              fontSize: 12,
              color: MUTED,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis"
            }}
          >
            <span style={{ fontFamily: monoFont, color: INK }}>{faculty.courseCode}</span>
            {" · "}
            {faculty.professorName}
          </div>
        ))}
      </div>
    </div>
  );
}
