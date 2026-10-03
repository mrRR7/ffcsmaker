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
