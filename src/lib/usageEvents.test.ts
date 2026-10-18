import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeUsageEvent, weeksBucket } from "./usageEvents";

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

test("buckets week counts", () => {
  assert.deepEqual([0, 1, 10, 11, 50, 51].map(weeksBucket), ["0", "1-10", "1-10", "11-50", "11-50", "50+"]);
});
