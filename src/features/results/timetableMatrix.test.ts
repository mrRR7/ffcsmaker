import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVtopSlotList } from "./timetableMatrix";
import { getSlotCatalog } from "@/engine/slotCatalog";
import type { ScoredTimetable } from "@/engine/types";

test("slot list reads like VTOP: code, slot, professor", () => {
  const slots = getSlotCatalog("standard");
  // In the order the catalog lists them ("B1, TB1"), as resolveTheorySlotIds returns.
  const ids = (...labels: string[]) => labels.flatMap((label) => slots.filter((slot) => slot.label === label).map((slot) => slot.id));
  const pick = (courseCode: string, professorName: string, theory: string[], lab: string[]) => ({
    courseId: courseCode, courseCode, courseName: courseCode, optionId: courseCode, professorName, credits: 3,
    theorySlotIds: ids(...theory), labSlotIds: ids(...lab), combinedSlotIds: [], displaySlots: []
  });
  const schedule = { selections: [pick("BCSE206L", "VIJAYARAJ J", ["B1", "TB1"], []), pick("BCSE209P", "MAHESWARI N", [], ["L25 + L26", "L25", "L26"])] } as unknown as ScoredTimetable;
  assert.equal(buildVtopSlotList(schedule, slots), "BCSE206L — B1+TB1 — VIJAYARAJ J\nBCSE209P — L25+L26 — MAHESWARI N");
});
