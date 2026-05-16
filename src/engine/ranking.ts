import { Constraints, RankingMode, ScheduleMetrics, TimetableSelection } from "./types";
import { parseTime } from "./conflict";

type Weights = {
  freeDays: number;
  halfDays: number;
  compactness: number;
  lowGaps: number;
  earlyFinish: number;
  lateStart: number;
  balancedLoad: number;
  professorPreference: number;
};

const profiles: Record<RankingMode, Weights> = {
  Balanced: {
    freeDays: 0,
    halfDays: 8,
    compactness: 13,
    lowGaps: 12,
    earlyFinish: 8,
    lateStart: 6,
    balancedLoad: 8,
    professorPreference: 9
  },
  Compact: {
    freeDays: 0,
    halfDays: 8,
    compactness: 24,
    lowGaps: 20,
    earlyFinish: 4,
    lateStart: 3,
    balancedLoad: 8,
    professorPreference: 5
  },
  "Free-Day Focused": {
    freeDays: 0,
    halfDays: 8,
    compactness: 8,
    lowGaps: 8,
    earlyFinish: 6,
    lateStart: 4,
    balancedLoad: 4,
    professorPreference: 5
  },
  "Half-Day Focused": {
    freeDays: 0,
    halfDays: 26,
    compactness: 10,
    lowGaps: 10,
    earlyFinish: 10,
    lateStart: 5,
    balancedLoad: 4,
    professorPreference: 6
  },
  "Early Finish": {
    freeDays: 0,
    halfDays: 10,
    compactness: 8,
    lowGaps: 10,
    earlyFinish: 28,
    lateStart: 2,
    balancedLoad: 4,
    professorPreference: 5
  },
  "Low Gaps": {
    freeDays: 0,
    halfDays: 8,
    compactness: 18,
    lowGaps: 28,
    earlyFinish: 6,
    lateStart: 3,
    balancedLoad: 8,
    professorPreference: 5
  },
  Relaxed: {
    freeDays: 0,
    halfDays: 13,
    compactness: 7,
    lowGaps: 8,
    earlyFinish: 7,
    lateStart: 15,
    balancedLoad: 5,
    professorPreference: 8
  },
  Custom: {
    freeDays: 0,
    halfDays: 10,
    compactness: 14,
    lowGaps: 14,
    earlyFinish: 10,
    lateStart: 8,
    balancedLoad: 8,
    professorPreference: 10
  }
};

function normalize(value: number, max: number) {
  if (!Number.isFinite(value) || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, value / max));
}

function inverted(value: number, max: number) {
  return 1 - normalize(value, max);
}

export function getRankingProfiles() {
  return (Object.keys(profiles) as RankingMode[]).filter(
    (profile) => profile !== "Free-Day Focused"
  );
}

export function scoreSchedule(
  metrics: ScheduleMetrics,
  selections: TimetableSelection[],
  mode: RankingMode,
  constraints: Constraints
) {
  const weights = profiles[mode] ?? profiles.Balanced;
  const preferredProfessorMatches = selections.filter((selection) =>
    constraints.preferredProfessors.some(
      (professor) =>
        professor.trim().length > 0 &&
        selection.professorName.toLowerCase().includes(professor.toLowerCase())
    )
  ).length;

  const latestEndMinutes = parseTime(metrics.latestEndTime);
  const earliestStartMinutes = parseTime(metrics.earliestStartTime);

  const breakdown = {
    freeDays: normalize(metrics.freeDays, 3) * weights.freeDays,
    halfDays: normalize(metrics.halfDays, 4) * weights.halfDays,
    compactness: normalize(metrics.compactness, 100) * weights.compactness,
    lowGaps: inverted(metrics.totalGapSlots, 10) * weights.lowGaps,
    earlyFinish: inverted(latestEndMinutes - 14 * 60, 6 * 60) * weights.earlyFinish,
    lateStart: normalize(earliestStartMinutes - 8 * 60, 3 * 60) * weights.lateStart,
    balancedLoad:
      inverted(metrics.dailyLoadVariance, 4) * weights.balancedLoad,
    professorPreference:
      normalize(preferredProfessorMatches, Math.max(1, selections.length)) *
      weights.professorPreference
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return {
    score: Number(score.toFixed(1)),
    scoreBreakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, value]) => [key, Number(value.toFixed(1))])
    )
  };
}
