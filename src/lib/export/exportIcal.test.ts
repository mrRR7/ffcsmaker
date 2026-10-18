import { test } from "node:test";
import assert from "node:assert/strict";
import { getFirstOccurrence } from "./exportIcal";

test("first class lands on its own weekday for IST users", () => {
  process.env.TZ = "Asia/Kolkata";
  // 2026-10-18 is a Sunday.
  assert.equal(getFirstOccurrence("2026-10-18", "Monday"), "2026-10-19");
  assert.equal(getFirstOccurrence("2026-10-18", "Tuesday"), "2026-10-20");
  assert.equal(getFirstOccurrence("2026-10-19", "Monday"), "2026-10-19");
});
