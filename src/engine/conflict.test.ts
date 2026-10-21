import { test } from "node:test";
import assert from "node:assert/strict";
import { hasConsecutiveLabs, indexSlots } from "./conflict";
import type { TimeSlot } from "./types";

const lab = (id: string, day: TimeSlot["day"], startTime: string, endTime: string): TimeSlot => ({
  id, label: id, day, startTime, endTime, kind: "lab"
});
const map = indexSlots([
  lab("L1", "Monday", "08:00", "09:40"),
  lab("L3", "Monday", "09:50", "11:30"),
  lab("L31", "Monday", "14:00", "15:40"),
  lab("L7", "Tuesday", "09:50", "11:30")
]);

test("labs 10 minutes apart are consecutive", () => {
  assert.equal(hasConsecutiveLabs(["L1", "L3"], map), true);
});

test("a real break, or a different day, is fine", () => {
  assert.equal(hasConsecutiveLabs(["L1", "L31"], map), false);
  assert.equal(hasConsecutiveLabs(["L1", "L7"], map), false);
});
