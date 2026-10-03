import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchAllRows } from "./fetchAllRows";

// Mimics PostgREST: honors range() but never returns more than maxRows.
function fakeTable(rows: number[], maxRows: number) {
  return (from: number, to: number) =>
    Promise.resolve({ data: rows.slice(from, Math.min(to + 1, from + maxRows)), error: null });
}

const rows = Array.from({ length: 2345 }, (_, i) => i);

test("returns every row past the max_rows cap", async () => {
  assert.deepEqual(await fetchAllRows(fakeTable(rows, 1000)), rows);
});

test("stays correct when max_rows is below the page size", async () => {
  assert.deepEqual(await fetchAllRows(fakeTable(rows, 300)), rows);
});

test("surfaces query errors", async () => {
  await assert.rejects(
    fetchAllRows(() => Promise.resolve({ data: null, error: { message: "boom" } })),
    /boom/
  );
});
