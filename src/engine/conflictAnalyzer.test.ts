import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeZeroResultCause } from "./conflictAnalyzer";
import { defaultConstraints } from "./defaults";
import type { Course, TimeSlot } from "./types";

const slots: TimeSlot[] = [
  { id: "A1", label: "A1", day: "Monday", startTime: "08:00", endTime: "08:50", kind: "theory" },
  { id: "C1", label: "C1", day: "Tuesday", startTime: "09:00", endTime: "09:50", kind: "theory" },
  { id: "B1", label: "B1", day: "Monday", startTime: "09:00", endTime: "09:50", kind: "theory" }
];
const course = (id: string, slotIds: string[]): Course => ({
  id, courseCode: id, courseName: id, credits: 3,
  options: slotIds.map((slotId) => ({ id: `${id}-${slotId}`, professorName: id, program: null, theorySlotIds: [slotId], labSlotIds: [], combinedSlotIds: [] }))
});

test("blames the time rule when it causes the clash", () => {
  // No 8 AM removes X's A1 option, leaving X and Y both on C1.
  const [finding] = analyzeZeroResultCause([course("X", ["A1", "C1"]), course("Y", ["C1"])], slots, { ...defaultConstraints, earliestStart: "08:30" });
  assert.equal(finding.type, "course_always_conflicts");
  assert.equal(finding.fromRules, true);
});

test("blames the courses when they clash with no rules at all", () => {
  const [finding] = analyzeZeroResultCause([course("X", ["C1"]), course("Y", ["C1"])], slots, defaultConstraints);
  assert.equal(finding.type, "course_always_conflicts");
  assert.equal(finding.fromRules, false);
});

test("names the courses when three clash as a group but no pair does", () => {
  const courses = [course("X", ["A1", "C1"]), course("Y", ["A1", "C1"]), course("Z", ["A1", "C1"]), course("W", ["B1"])];
  const [finding] = analyzeZeroResultCause(courses, slots, defaultConstraints);
  assert.equal(finding.type, "courses_cant_all_fit");
  assert.deepEqual(finding.courseCodes, ["X", "Y", "Z"]);
});

test("names a whole-week rule that no week can keep", () => {
  const [finding] = analyzeZeroResultCause([course("X", ["A1"]), course("Y", ["B1"])], slots, { ...defaultConstraints, maxClassesPerDay: 1 });
  assert.equal(finding.type, "rule_blocks_all");
  assert.equal(finding.constraintLabel, "At most 1 class a day");
});
