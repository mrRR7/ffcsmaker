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
  facultyPreference: number;
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
    facultyPreference: 10
  },
  Compact: {
    freeDays: 0,
    halfDays: 8,
    compactness: 24,
    lowGaps: 20,
    earlyFinish: 4,
    lateStart: 3,
    balancedLoad: 8,
    facultyPreference: 8
  },
  "Free-Day Focused": {
    freeDays: 0,
    halfDays: 8,
    compactness: 8,
    lowGaps: 8,
    earlyFinish: 6,
    lateStart: 4,
    balancedLoad: 4,
    facultyPreference: 8
  },
  "Half-Day Focused": {
    freeDays: 0,
    halfDays: 26,
    compactness: 10,
    lowGaps: 10,
    earlyFinish: 10,
    lateStart: 5,
    balancedLoad: 4,
    facultyPreference: 8
  },
  "Early Finish": {
    freeDays: 0,
    halfDays: 10,
    compactness: 8,
    lowGaps: 10,
    earlyFinish: 28,
    lateStart: 2,
    balancedLoad: 4,
    facultyPreference: 8
  },
  "Low Gaps": {
    freeDays: 0,
    halfDays: 8,
    compactness: 18,
    lowGaps: 28,
    earlyFinish: 6,
    lateStart: 3,
    balancedLoad: 8,
    facultyPreference: 8
  },
  Relaxed: {
    freeDays: 0,
    halfDays: 13,
    compactness: 7,
    lowGaps: 8,
    earlyFinish: 7,
    lateStart: 15,
    balancedLoad: 5,
    facultyPreference: 10
  },
  Custom: {
    freeDays: 0,
    halfDays: 10,
    compactness: 14,
    lowGaps: 14,
    earlyFinish: 10,
    lateStart: 8,
    balancedLoad: 8,
    facultyPreference: 12
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

function facultyDecayScore(position: number, rankLength: number): number {
  if (rankLength <= 1) return 1;
  const t = position / (rankLength - 1);
  return Math.max(0, 1 - Math.pow(t, 0.8));
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
  
  let facultyPrefScore = 0;
  let coursesWithRanking = 0;

  for (const selection of selections) {
    const ranking = constraints.facultyRanking[selection.courseId];
    if (!ranking || ranking.length === 0) continue;

    coursesWithRanking++;
    const position = ranking.indexOf(selection.optionId);

    if (position >= 0) {
      facultyPrefScore += facultyDecayScore(position, ranking.length);
    }

    const avoided = constraints.avoidedFacultyByCourse[selection.courseId];
    if (avoided?.includes(selection.optionId)) {
      facultyPrefScore -= 1; // Heavy penalty
    }
  }

  // Allowed to go negative if avoided penalties outweigh preferences
  const rawFacultyScore = coursesWithRanking > 0 ? (facultyPrefScore / coursesWithRanking) : 0;

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
    facultyPreference: rawFacultyScore * weights.facultyPreference
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return {
    rawFacultyScore,
    score: Number(score.toFixed(1)),
    scoreBreakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, value]) => [key, Number(value.toFixed(1))])
    )
  };
}
