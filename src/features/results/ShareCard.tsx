"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  CAMPUS_LABELS,
  Campus,
  DAYS,
  SHARE_CARD_DIMENSIONS,
  ScoredTimetable,
  ShareCardSize,
  TimeSlot
} from "@/engine/types";

import {
  buildMatrixCells,
  buildMatrixColumns,
} from "@/features/results/timetableMatrix";

const COURSE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
];

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Props = {
  id: string;
  size: ShareCardSize;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  campus: Campus;
  semesterLabel: string;
};

export function ShareCard({ id, size, schedule, slots, campus, semesterLabel }: Props) {
  const { width, height } = SHARE_CARD_DIMENSIONS[size];
  const isStory = size === "story";
  const totalCredits = schedule.selections.reduce(
    (sum, selection) => sum + selection.credits,
    0
  );
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const courseBySlot = new Map<string, { code: string; color: string }>();

  schedule.selections.forEach((selection, index) => {
    const color = COURSE_COLORS[index % COURSE_COLORS.length];
    const slotIds =
      selection.combinedSlotIds.length > 0
        ? selection.combinedSlotIds
        : [...selection.theorySlotIds, ...selection.labSlotIds];
    slotIds.forEach((slotId) => {
      courseBySlot.set(slotId, { code: selection.courseCode, color });
    });
  });

  const uniqueTimes = Array.from(
    new Map(
      slots
        .filter((slot) => courseBySlot.has(slot.id))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((slot) => [`${slot.startTime}-${slot.endTime}`, slot])
    ).values()
  );

  const root: CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width,
    height,
    zIndex: -1,
    pointerEvents: "none",
    padding: isStory ? 72 : 56,
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#080a0f",
    color: "#f8fafc",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: isStory ? 34 : 24
  };

  const cell: CSSProperties = {
    height: isStory ? 74 : 48,
    borderRadius: 8,
    background: "rgba(255,255,255,0.055)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  };

  return (
    <div id={id} style={root}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: isStory ? 34 : 28, fontWeight: 800 }}>
          Ultimate FFCS
        </div>
        <div
          style={{
            border: "1px solid rgba(59,130,246,0.45)",
            borderRadius: 999,
            padding: isStory ? "10px 18px" : "8px 14px",
            color: "#93c5fd",
            fontSize: isStory ? 22 : 18,
            fontWeight: 700
          }}
        >
          {CAMPUS_LABELS[campus]}
        </div>
      </div>

      <div>
        <div style={{ fontSize: isStory ? 48 : 34, fontWeight: 800 }}>
          My FFCS Timetable
        </div>
        <div style={{ marginTop: 8, color: "#94a3b8", fontSize: isStory ? 24 : 18 }}>
          {semesterLabel} | {totalCredits} credits
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "82px repeat(5, 1fr)", gap: 8 }}>
        <div />
        {DAY_ABBR.map((day) => (
          <div
            key={day}
            style={{
              color: "#94a3b8",
              fontSize: isStory ? 18 : 14,
              fontWeight: 800,
              textAlign: "center"
            }}
          >
            {day}
          </div>
        ))}
        {uniqueTimes.map((timeSlot) => {
          const timeKey = `${timeSlot.startTime}-${timeSlot.endTime}`;
          return (
            <RowFragment key={timeKey}>
              <div
                style={{
                  ...cell,
                  background: "transparent",
                  color: "#64748b",
                  fontSize: isStory ? 18 : 14,
                  fontWeight: 800
                }}
              >
                {timeSlot.startTime.slice(0, 5)}
              </div>
              {DAYS.map((day) => {
                const slot = slots.find(
                  (candidate) =>
                    candidate.day === day &&
                    candidate.startTime === timeSlot.startTime &&
                    candidate.endTime === timeSlot.endTime
                );
                const course = slot ? courseBySlot.get(slot.id) : null;
                return (
                  <div key={`${timeKey}-${day}`} style={cell}>
                    {course ? (
                      <div
                        style={{
                          maxWidth: "92%",
                          borderRadius: 7,
                          background: course.color,
                          padding: "7px 8px",
                          color: "#ffffff",
                          fontSize: isStory ? 18 : 13,
                          fontWeight: 900,
                          lineHeight: 1,
                          textAlign: "center"
                        }}
                      >
                        {course.code}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </RowFragment>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {schedule.selections.map((selection, index) => {
          const color = COURSE_COLORS[index % COURSE_COLORS.length];
          return (
            <div
              key={selection.courseId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                padding: isStory ? "12px 16px" : "8px 12px",
                fontSize: isStory ? 19 : 14,
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: isStory ? 14 : 10,
                  height: isStory ? 14 : 10,
                  borderRadius: 999,
                  background: color
                }}
              />
              {selection.courseCode}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#64748b", fontSize: isStory ? 22 : 16, fontWeight: 700 }}>
          ffcinator
        </div>
        <div
          style={{
            borderRadius: 999,
            background: "#1d4ed8",
            padding: isStory ? "12px 20px" : "8px 16px",
            fontSize: isStory ? 22 : 16,
            fontWeight: 900
          }}
        >
          Score {Math.round(schedule.score)}
        </div>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
