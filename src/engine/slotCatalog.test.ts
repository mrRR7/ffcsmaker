import { test } from "node:test";
import assert from "node:assert/strict";
import { getSlotCatalog } from "./slotCatalog";
import { CAMPUS_SLOT_VARIANT } from "./types";
import { buildMatrixColumns } from "@/features/results/timetableMatrix";

const theory = (variant: "standard" | "vellore", day: string) =>
  getSlotCatalog(variant)
    .filter((slot) => slot.kind === "theory" && slot.day === day)
    .map((slot) => `${slot.startTime} ${slot.label}`);

test("Chennai keeps the standard catalog; Vellore has its own", () => {
  assert.equal(CAMPUS_SLOT_VARIANT.chennai, "standard");
  assert.equal(CAMPUS_SLOT_VARIANT.vellore, "vellore");
  assert.deepEqual(theory("standard", "Monday").slice(5, 7), ["12:35 S11", "14:00 A2"]);
  assert.deepEqual(theory("vellore", "Wednesday"), [
    "08:00 C1", "09:00 A1", "10:00 F1", "11:00 V1", "12:00 V2",
    "14:00 C2", "15:00 A2", "16:00 F2", "17:00 TD2", "18:00 TBB2", "19:01 V5"
  ]);
});

test("theory and lab rows line up column for column", () => {
  for (const variant of ["standard", "vellore"] as const) {
    const { theory: th, lab } = buildMatrixColumns(getSlotCatalog(variant));
    assert.equal(th.length, lab.length, variant);
    assert.equal(
      th.findIndex((column) => column.kind === "lunch"),
      lab.findIndex((column) => column.kind === "lunch"),
      variant
    );
  }
});
