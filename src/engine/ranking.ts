import { Constraints, RankingMode, ScheduleMetrics, TimetableSelection } from "./types";
import { parseTime } from "./conflict";

// Free days aren't a factor: with a normal VIT load a fully free weekday is
// practically impossible, so weighting it only added noise. Compactness was
// gap time counted a second time, so it's folded into lowGaps.
type Weights = {
  halfDays: number;
  lowGaps: number;
  earlyFinish: number;
  lateStart: number;
  balancedLoad: number;
  facultyPreference: number;
};

const profiles: Record<RankingMode, Weights> = {
  Balanced: { halfDays: 10, lowGaps: 14, earlyFinish: 10, lateStart: 8, balancedLoad: 8, facultyPreference: 10 },
  "Half Days": { halfDays: 30, lowGaps: 10, earlyFinish: 8, lateStart: 4, balancedLoad: 3, facultyPreference: 8 },
  "Minimize Gaps": { halfDays: 6, lowGaps: 32, earlyFinish: 6, lateStart: 3, balancedLoad: 8, facultyPreference: 8 },
  "Early Finish": { halfDays: 8, lowGaps: 10, earlyFinish: 30, lateStart: 2, balancedLoad: 4, facultyPreference: 8 },
  "Late Start": { halfDays: 8, lowGaps: 8, earlyFinish: 4, lateStart: 30, balancedLoad: 4, facultyPreference: 8 },
  Custom: { halfDays: 10, lowGaps: 16, earlyFinish: 10, lateStart: 8, balancedLoad: 8, facultyPreference: 12 }
};

// "My list order" bonus, as a weight next to the profile's own weights.
const PRIORITY_WEIGHT = 15;

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

export function getRankingProfiles(): RankingMode[] {
  return ["Balanced", "Half Days", "Minimize Gaps", "Early Finish", "Late Start"];
}

export function mapLegacyRankingMode(mode?: string | null): RankingMode {
  if (!mode) return "Balanced";
  switch (mode) {
    case "Balanced":
      return "Balanced";
    case "Compact":
    case "Low Gaps":
    case "Minimize Gaps":
      return "Minimize Gaps";
    case "Half-Day Focused":
    case "Half Days":
      return "Half Days";
    case "Early Finish":
      return "Early Finish";
    case "Relaxed":
    case "Late Start":
      return "Late Start";
    case "Custom":
      return "Custom";
    default:
      return "Balanced";
  }
}

/**
 * Scores a week 0-100: each factor is a 0-1 value, weighted by the ranking
 * profile and divided by the total weight in play, so 100 means "best
 * possible on everything this profile cares about".
 *
 * Start/finish use the average across class days, not the single earliest
 * start / latest end of the week: otherwise one 8am class on Monday gave
 * every week the same Late Start value and the profile ranked nothing.
 *
 * `priority` is the 0-1 "My list order" match, or null when that's off.
 */
export function scoreSchedule(
  metrics: ScheduleMetrics,
  selections: TimetableSelection[],
  mode: RankingMode,
  constraints: Constraints,
  priority: number | null = null
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

  const factors: Record<string, [value: number, weight: number]> = {
    // Share of class days that fit inside a 4-hour window.
    halfDays: [metrics.activeDays > 0 ? metrics.halfDays / metrics.activeDays : 0, weights.halfDays],
    // Empty periods per class day; 6+ a day is the worst case. A flat cap on the
    // weekly total (it was 10) zeroed this out for almost every real week.
    lowGaps: [inverted(metrics.activeDays > 0 ? metrics.totalGapSlots / metrics.activeDays : 0, 6), weights.lowGaps],
    // Average day ending by 12:00 scores 1, by 19:00 scores 0.
    earlyFinish: [inverted(metrics.averageDayEndMinutes - 12 * 60, 7 * 60), weights.earlyFinish],
    // Average day starting at 8:00 scores 0, at 14:00 (afternoon-only) scores 1.
    lateStart: [normalize(metrics.averageDayStartMinutes - 8 * 60, 6 * 60), weights.lateStart],
    balancedLoad: [inverted(metrics.dailyLoadVariance, 4), weights.balancedLoad]
  };
  // Only count factors the student actually set, so an unused one can't cap the score.
  if (coursesWithRanking > 0) factors.facultyPreference = [rawFacultyScore, weights.facultyPreference];
  if (priority !== null) factors.priority = [priority, PRIORITY_WEIGHT];

  const totalWeight = Object.values(factors).reduce((sum, [, weight]) => sum + weight, 0);
  const breakdown = Object.fromEntries(
    Object.entries(factors).map(([key, [value, weight]]) => [key, Number(((100 * value * weight) / totalWeight).toFixed(1))])
  );
  const raw = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    rawFacultyScore,
    score: Number(Math.max(0, Math.min(100, raw)).toFixed(1)),
    scoreBreakdown: breakdown
  };
}
