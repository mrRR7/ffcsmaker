import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSchedule } from "./ranking";
import { defaultConstraints } from "./defaults";
import type { ScheduleMetrics } from "./types";

function metrics(overrides: Partial<ScheduleMetrics>): ScheduleMetrics {
  return {
    freeDays: 1,
    halfDays: 0,
    totalGapHours: 0,
    totalGapSlots: 0,
    averageGapHours: 0,
    compactness: 0,
    earliestStartTime: "08:00",
    latestEndTime: "19:30",
    averageEndTime: "14:00",
    averageDayStartMinutes: 8 * 60,
    averageDayEndMinutes: 16 * 60,
    morningClassCount: 0,
    eveningClassCount: 0,
    totalClasses: 20,
    activeDays: 5,
    dailyLoadVariance: 0,
    facultyMatchPercentage: 0,
    ...overrides
  };
}

const score = (m: ScheduleMetrics, mode: Parameters<typeof scoreSchedule>[2] = "Balanced") =>
  scoreSchedule(m, [], mode, defaultConstraints).score;

test("Late Start tells weeks apart even when both have an 8am class somewhere", () => {
  // Same earliest start (08:00) for the week; one week starts later on most days.
  const mostlyMornings = metrics({ averageDayStartMinutes: 8 * 60 + 30 });
  const mostlyAfternoons = metrics({ averageDayStartMinutes: 12 * 60 });
  assert.ok(score(mostlyAfternoons, "Late Start") > score(mostlyMornings, "Late Start"));
});

test("Early Finish uses the typical day, not the single latest class", () => {
  const lateEveryDay = metrics({ averageDayEndMinutes: 19 * 60 });
  const lateOnce = metrics({ averageDayEndMinutes: 14 * 60 });
  assert.ok(score(lateOnce, "Early Finish") > score(lateEveryDay, "Early Finish"));
});

test("scores sit on a 0-100 scale", () => {
  const best = metrics({ halfDays: 5, averageDayStartMinutes: 14 * 60, averageDayEndMinutes: 12 * 60 });
  const worst = metrics({ totalGapSlots: 40, dailyLoadVariance: 10, averageDayEndMinutes: 19 * 60 + 30 });
  assert.equal(score(best), 100);
  assert.equal(score(worst), 0);
});

test("Minimize Gaps still separates weeks with a realistic number of gaps", () => {
  assert.ok(score(metrics({ totalGapSlots: 12 }), "Minimize Gaps") > score(metrics({ totalGapSlots: 24 }), "Minimize Gaps"));
});

test("free days don't change the score", () => {
  assert.equal(score(metrics({ freeDays: 0 })), score(metrics({ freeDays: 3 })));
});
