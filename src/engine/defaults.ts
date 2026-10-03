import type { Constraints } from "./types";

export const defaultConstraints: Constraints = {
  blockedWindows: [],
  noAfterTime: null,
  avoidFirstPeriod: false,
  avoidLastPeriod: false,
  preferredDaysOff: [],
  maxGapSlots: null,
  maxClassesPerDay: null,
  requireMinFreeDays: null,
  professorLocks: [],
  avoidDays: [],
  avoidProfessors: [],
  endBeforeByDay: {},
  preferredProfessors: [],
  earliestStart: null,
  latestEnd: null,
  startAfterByDay: {},
  latestEndByDay: {},
  facultyRanking: {},
  avoidedFacultyByCourse: {}
};
