import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeUsageBatch, sanitizeUsageEvent, weeksBucket } from "./usageEvents";

test("rejects unknown event names", () => {
  assert.equal(sanitizeUsageEvent({ name: "drop_table" }), null);
  assert.equal(sanitizeUsageEvent({ name: "toString" }), null);
  assert.equal(sanitizeUsageEvent("course_added"), null);
});

test("keeps allowlisted props, drops unknown and invalid ones", () => {
  assert.deepEqual(
    sanitizeUsageEvent({
      name: "generate_completed",
      campus: "vellore",
      props: { weeks: "11-50", ms: 1234.6, professor: "Dr X", userId: "abc" }
    }),
    { name: "generate_completed", campus: "vellore", props: { weeks: "11-50", ms: 1235 } }
  );
  assert.deepEqual(
    sanitizeUsageEvent({ name: "course_added", campus: "mars", props: { source: "hacker" } }),
    { name: "course_added", campus: null, props: {} }
  );
  assert.deepEqual(sanitizeUsageEvent({ name: "generate_started", props: { courses: -3 } })?.props, {});
});

test("program codes pass, anything that could identify someone doesn't", () => {
  const program = (value: unknown) => sanitizeUsageEvent({ name: "course_added", props: { program: value } })?.props.program;
  assert.equal(program("BCE"), "BCE");
  assert.equal(program("other"), "other");
  assert.equal(program("bce"), undefined);
  assert.equal(program("RAKESHR"), undefined);
  assert.equal(program(42), undefined);
});

test("buckets week counts", () => {
  assert.deepEqual([0, 1, 10, 11, 50, 51].map(weeksBucket), ["0", "1-10", "1-10", "11-50", "11-50", "50+"]);
});

test("accepts batches and the legacy single-event body", () => {
  assert.deepEqual(sanitizeUsageBatch({ name: "slot_list_copied", campus: "chennai" }), [
    { name: "slot_list_copied", campus: "chennai", props: {} }
  ]);
  assert.deepEqual(
    sanitizeUsageBatch({ events: [{ name: "timetable_saved" }, { name: "drop_table" }, null, { name: "ical_exported" }] })?.map(
      (row) => row.name
    ),
    ["timetable_saved", "ical_exported"]
  );
  assert.deepEqual(sanitizeUsageBatch({ name: "drop_table" }), []);
});

test("rejects malformed and oversized batches", () => {
  assert.equal(sanitizeUsageBatch(null), null);
  assert.equal(sanitizeUsageBatch("events"), null);
  assert.equal(sanitizeUsageBatch({ events: "course_added" }), null);
  assert.equal(sanitizeUsageBatch({ events: Array(51).fill({ name: "slot_list_copied" }) }), null);
  assert.equal(sanitizeUsageBatch({ events: Array(50).fill({ name: "slot_list_copied" }) })?.length, 50);
});
