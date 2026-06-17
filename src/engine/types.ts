export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

export type DayOfWeek = (typeof DAYS)[number];

export type Campus = "chennai" | "vellore" | "bhopal" | "ap";
export type SlotVariant = "standard" | "bhopal" | "ap";

export const CAMPUS_SLOT_VARIANT: Record<Campus, SlotVariant> = {
  chennai: "standard",
  vellore: "standard",
  bhopal: "bhopal",
  ap: "ap"
};

export const CAMPUS_LABELS: Record<Campus, string> = {
  chennai: "VIT Chennai",
  vellore: "VIT Vellore",
  bhopal: "VIT Bhopal",
  ap: "VIT AP"
};

export interface TimeSlot {
  id: string;
  label: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  kind?: "theory" | "lab";
  duration?: number;
}

export interface CourseOption {
  id: string;
  professorName: string;
  theorySlotIds: string[];
  labSlotIds: string[];
  combinedSlotIds: string[];
  professorRating?: number;
  notes?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  color?: string;
  options: CourseOption[];
}

export interface BlockedWindow {
  id: string;
  day: DayOfWeek | "All";
  startTime: string;
  endTime: string;
  label?: string;
}

export interface Constraints {
  blockedWindows: BlockedWindow[];
  noAfterTime: string | null;
  earliestStart: string | null;
  latestEnd: string | null;
  startAfterByDay: Partial<Record<DayOfWeek, string | null>>;
  latestEndByDay: Partial<Record<DayOfWeek, string | null>>;
  facultyRanking: Record<string, string[]>;
  avoidedFacultyByCourse: Record<string, string[]>;
  avoidFirstPeriod: boolean;
  avoidLastPeriod: boolean;
  preferredDaysOff: DayOfWeek[];
  maxGapSlots: number | null;
  maxClassesPerDay: number | null;
  requireMinFreeDays: number | null;
  minimizeDays: boolean;
  preferCompactness: boolean;
  preferHalfDays: boolean;
  preferEarlyFinish: boolean;
  professorLocks: string[];
  avoidDays: DayOfWeek[];
  avoidProfessors: string[];
  endBeforeByDay: Partial<Record<DayOfWeek, string | null>>;
  preferredProfessors: string[];
}

export interface ScheduleMetrics {
  freeDays: number;
  halfDays: number;
  totalGapHours: number;
  totalGapSlots: number;
  averageGapHours: number;
  compactness: number;
  earliestStartTime: string;
  latestEndTime: string;
  averageEndTime: string;
  morningClassCount: number;
  eveningClassCount: number;
  totalClasses: number;
  activeDays: number;
  dailyLoadVariance: number;
  facultyMatchPercentage: number;
}

export interface TimetableSelection {
  courseId: string;
  courseCode: string;
  courseName: string;
  optionId: string;
  professorName: string;
  credits: number;
  theorySlotIds: string[];
  labSlotIds: string[];
  combinedSlotIds: string[];
  displaySlots: string[];
}

export type RankingMode =
  | "Balanced"
  | "Half Days"
  | "Minimize Gaps"
  | "Early Finish"
  | "Late Start"
  | "Custom";

export interface ScoredTimetable {
  id: string;
  selections: TimetableSelection[];
  metrics: ScheduleMetrics;
  score: number;
  rankingMode: RankingMode | string;
  scoreBreakdown: Record<string, number>;
}

export type ShareCardSize = "square" | "story";

export const SHARE_CARD_DIMENSIONS: Record<
  ShareCardSize,
  { width: number; height: number }
> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 }
};

export interface ShareCardConfig {
  size: ShareCardSize;
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  campus: Campus;
  semesterLabel: string;
}

export interface TimetableShapeGroup {
  shapeId: string;
  shapeFingerprint: string;
  representative: ScoredTimetable;
  bestFacultyVariant: ScoredTimetable | null;
  alternatives: ScoredTimetable[];
  variantCount: number;
}

export interface SavedSchedule {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  timetable: ScoredTimetable;
  notes?: string;
}

export interface ExportPreferences {
  includeMetrics: boolean;
  includeCourseList: boolean;
  includeScoreBreakdown: boolean;
}

export interface UiPreferences {
  theme: "dark" | "light";
  compactMode: boolean;
  defaultRankingMode: RankingMode;
  usePriorityRanking: boolean;
  exportPreferences: ExportPreferences;
}

export interface SharedPlannerState {
  version: 1;
  slots: TimeSlot[];
  courses: Course[];
  constraints: Constraints;
  rankingMode: RankingMode;
  usePriorityRanking?: boolean;
  activeSchedule?: ScoredTimetable | null;
}

export interface GeneratePayload {
  slots: TimeSlot[];
  slotVariant?: SlotVariant;
  courses: Course[];
  constraints: Constraints;
  rankingMode: RankingMode;
  usePriorityRanking?: boolean;
  maxResults?: number;
}

export type WorkerProgressMessage = {
  type: "progress";
  checked: number;
  accepted: number;
  progress: number;
};

export type WorkerDoneMessage = {
  type: "done";
  schedules: ScoredTimetable[];
  checked: number;
};

export type WorkerErrorMessage = {
  type: "error";
  message: string;
};

export type WorkerMessage =
  | WorkerProgressMessage
  | WorkerDoneMessage
  | WorkerErrorMessage;
