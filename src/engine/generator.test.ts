import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTimetables } from "./generator";
import { defaultConstraints } from "./defaults";
import type { Course, CourseOption, GeneratePayload, TimeSlot } from "./types";

const slots: TimeSlot[] = [
  { id: "A1", label: "A1", day: "Monday", startTime: "08:00", endTime: "08:50", kind: "theory" },
  // Same period as A1, so any option on B1 clashes with one on A1.
  { id: "B1", label: "B1", day: "Monday", startTime: "08:00", endTime: "08:50", kind: "theory" },
  { id: "C1", label: "C1", day: "Tuesday", startTime: "09:00", endTime: "09:50", kind: "theory" }
];

function option(id: string, slotId: string): CourseOption {
  return { id, professorName: id, program: null, theorySlotIds: [slotId], labSlotIds: [], combinedSlotIds: [] };
}

function course(id: string, options: CourseOption[]): Course {
  return { id, courseCode: id, courseName: id, credits: 3, options };
}

function payload(courses: Course[]): GeneratePayload {
  return { slots, courses, constraints: defaultConstraints, rankingMode: "Balanced" };
}

test("never pairs clashing options", () => {
  const { schedules, capped } = generateTimetables(
    payload([course("X", [option("x-A1", "A1")]), course("Y", [option("y-B1", "B1"), option("y-C1", "C1")])])
  );
  assert.equal(capped, false);
  assert.equal(schedules.length, 1);
  assert.deepEqual(
    schedules[0].selections.map((s) => s.optionId).sort(),
    ["x-A1", "y-C1"]
  );
});

test("returns nothing when every combination clashes", () => {
  const { schedules } = generateTimetables(
    payload([course("X", [option("x-A1", "A1")]), course("Y", [option("y-B1", "B1")])])
  );
  assert.equal(schedules.length, 0);
});

test("finds every layout even when professor permutations alone would fill the cap", () => {
  const many = (prefix: string, slotId: string, n: number) =>
    Array.from({ length: n }, (_, i) => option(`${prefix}-${slotId}-${i}`, slotId));
  const D1: TimeSlot = { id: "D1", label: "D1", day: "Wednesday", startTime: "10:00", endTime: "10:50", kind: "theory" };
  // 40 x 40 same-slot professors on the first layout; the other two layouts
  // used to be unreachable once 20 permutations of the first were found.
  const { schedules } = generateTimetables({
    ...payload([
      course("X", [...many("x", "A1", 40), option("x-C1", "C1")]),
      course("Y", [...many("y", "C1", 40), option("y-D1", "D1")])
    ]),
    slots: [...slots, D1],
    maxResults: 20
  });
  const layout = (s: (typeof schedules)[number]) => s.selections.map((sel) => sel.theorySlotIds[0]).sort().join("+");
  assert.deepEqual([...new Set(schedules.map(layout))].sort(), ["A1+C1", "A1+D1", "C1+D1"]);
  assert.ok(schedules.length <= 20);
  // Swap gets professors on the best layout first: wherever that layout has
  // same-slot alternatives, more than one professor must be offered.
  const best = schedules.filter((s) => layout(s) === layout(schedules[0]));
  for (const id of ["X", "Y"]) {
    const slot = best[0].selections.find((sel) => sel.courseId === id)?.theorySlotIds[0];
    const crowded = (id === "X" && slot === "A1") || (id === "Y" && slot === "C1");
    const profs = new Set(best.map((s) => s.selections.find((sel) => sel.courseId === id)?.optionId));
    assert.equal(profs.size > 1, crowded, `${id} on ${slot}: ${profs.size} professor(s)`);
  }
});
