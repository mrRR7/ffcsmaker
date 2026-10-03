import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeImport } from "./sanitize";

const option = {
  professorName: "IYAPPAN P",
  theorySlots: ["A1", "TA1"],
  labSlots: ["L23+L24"],
  credits: 4,
  program: null,
  notes: ""
};
const course = { courseCode: "BCSE202L", courseName: "Data Structures", credits: 4, options: [option] };
const valid = {
  campus: "vellore",
  semesterLabel: "",
  courses: [course],
  slots: [],
  faculty: [{ name: "someone else" }],
  capturedAt: "2026-10-03T00:00:00.000Z",
  source: "dom"
};

test("keeps a well-formed bookmarklet payload", () => {
  const out = sanitizeImport(valid);
  assert.deepEqual(out?.courses, [course]);
  // Rebuilt from the options, not trusted from the request.
  assert.deepEqual(out?.faculty, [{ name: "IYAPPAN P" }]);
});

test("drops fields the planner doesn't use", () => {
  const out = sanitizeImport({
    ...valid,
    injected: "<script>",
    courses: [{ ...course, extra: 1, options: [{ ...option, html: "<b>" }] }]
  });
  assert.ok(out);
  assert.equal("injected" in out, false);
  assert.deepEqual(out.courses, [course]);
});

test("rejects malformed or oversized input", () => {
  assert.equal(sanitizeImport(null), null);
  assert.equal(sanitizeImport({ courses: "nope" }), null);

  const withOption = (patch: object) =>
    sanitizeImport({ ...valid, courses: [{ ...course, options: [{ ...option, ...patch }] }] });
  assert.equal(withOption({ theorySlots: ["A1<img>"] }), null);
  assert.equal(withOption({ credits: -1 }), null);
  assert.equal(withOption({ professorName: "x".repeat(201) }), null);
  assert.equal(withOption({ program: 42 }), null);

  assert.equal(sanitizeImport({ ...valid, courses: Array(1501).fill(course) }), null);
});
