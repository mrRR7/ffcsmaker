"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BlockedWindow,
  Constraints,
  Course,
  CourseOption,
  RankingMode,
  SavedSchedule,
  ScoredTimetable,
  SharedPlannerState,
  TimeSlot,
  UiPreferences
} from "@/engine/types";
import { FIXED_SLOTS } from "@/engine/slotCatalog";

const courseColors = [
  "#14b8a6",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#a78bfa",
  "#f97316"
];

export const defaultSlots = FIXED_SLOTS;

export const defaultConstraints: Constraints = {
  blockedWindows: [],
  noBeforeTime: null,
  noAfterTime: null,
  avoidFirstPeriod: false,
  avoidLastPeriod: false,
  preferredDaysOff: [],
  maxGapSlots: null,
  maxClassesPerDay: null,
  requireMinFreeDays: null,
  minimizeDays: false,
  preferCompactness: true,
  preferHalfDays: true,
  preferEarlyFinish: true,
  professorLocks: [],
  avoidDays: [],
  avoidProfessors: [],
  endBeforeByDay: {},
  protectLunch: false,
  preferredProfessors: []
};

const defaultUiPreferences: UiPreferences = {
  theme: "dark",
  compactMode: false,
  defaultRankingMode: "Balanced",
  usePriorityRanking: false,
  exportPreferences: {
    includeMetrics: true,
    includeCourseList: true,
    includeScoreBreakdown: true
  }
};

function colorForIndex(index: number) {
  return courseColors[index % courseColors.length];
}

function normalizeImportedConstraints(constraints?: Partial<Constraints>): Constraints {
  return {
    ...defaultConstraints,
    ...constraints,
    preferredDaysOff: [],
    avoidDays: [],
    requireMinFreeDays: null,
    maxGapSlots:
      constraints?.maxGapSlots ??
      (typeof (constraints as { maxGapMinutes?: unknown } | undefined)?.maxGapMinutes ===
      "number"
        ? Math.round(
            Number((constraints as { maxGapMinutes?: number }).maxGapMinutes) / 55
          )
        : null)
  };
}

function cleanOption(option: CourseOption): CourseOption {
  return {
    ...option,
    combinedSlotIds: []
  };
}

export interface UniTimeStore {
  slots: TimeSlot[];
  courses: Course[];
  constraints: Constraints;
  generatedSchedules: ScoredTimetable[];
  activeScheduleId: string | null;
  savedSchedules: SavedSchedule[];
  compareScheduleIds: string[];
  rankingMode: RankingMode;
  uiPreferences: UiPreferences;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setRankingMode: (mode: RankingMode) => void;
  setTheme: (theme: UiPreferences["theme"]) => void;
  setCompactMode: (compactMode: boolean) => void;
  setUsePriorityRanking: (enabled: boolean) => void;
  setExportPreference: <K extends keyof UiPreferences["exportPreferences"]>(
    key: K,
    value: UiPreferences["exportPreferences"][K]
  ) => void;
  addSlot: (slot: Omit<TimeSlot, "id">) => void;
  updateSlot: (slotId: string, patch: Partial<TimeSlot>) => void;
  deleteSlot: (slotId: string) => void;
  clearSlots: () => void;
  applySlotPreset: (preset?: string) => void;
  importSlotsFromCsv: (csv?: string) => number;
  addCourse: (course: Omit<Course, "id" | "options" | "color">) => void;
  updateCourse: (courseId: string, patch: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  duplicateCourse: (courseId: string) => void;
  moveCourse: (courseId: string, direction: "up" | "down") => void;
  addOption: (courseId: string, option: Omit<CourseOption, "id">) => void;
  updateOption: (
    courseId: string,
    optionId: string,
    patch: Partial<CourseOption>
  ) => void;
  deleteOption: (courseId: string, optionId: string) => void;
  duplicateOption: (courseId: string, optionId: string) => void;
  moveOption: (
    courseId: string,
    optionId: string,
    direction: "up" | "down"
  ) => void;
  toggleProfessorLock: (courseId: string, optionId: string) => void;
  setConstraint: <K extends keyof Constraints>(key: K, value: Constraints[K]) => void;
  addBlockedWindow: (blockedWindow: Omit<BlockedWindow, "id">) => void;
  updateBlockedWindow: (
    blockedWindowId: string,
    patch: Partial<BlockedWindow>
  ) => void;
  deleteBlockedWindow: (blockedWindowId: string) => void;
  resetConstraints: () => void;
  setGeneratedSchedules: (schedules: ScoredTimetable[]) => void;
  setActiveScheduleId: (scheduleId: string | null) => void;
  saveSchedule: (schedule: ScoredTimetable, name?: string) => void;
  deleteSavedSchedule: (savedId: string) => void;
  renameSavedSchedule: (savedId: string, name: string) => void;
  toggleFavoriteSchedule: (savedId: string) => void;
  addCompareSchedule: (scheduleId: string) => void;
  removeCompareSchedule: (scheduleId: string) => void;
  clearCompare: () => void;
  applySharedState: (sharedState: SharedPlannerState) => void;
  resetAll: () => void;
}

export const useAppStore = create<UniTimeStore>()(
  persist(
    (set) => ({
      slots: defaultSlots,
      courses: [],
      constraints: defaultConstraints,
      generatedSchedules: [],
      activeScheduleId: null,
      savedSchedules: [],
      compareScheduleIds: [],
      rankingMode: "Balanced",
      uiPreferences: defaultUiPreferences,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setRankingMode: (mode) =>
        set((state) => ({
          rankingMode: mode,
          uiPreferences: {
            ...state.uiPreferences,
            defaultRankingMode: mode
          }
        })),
      setTheme: (theme) =>
        set((state) => ({
          uiPreferences: {
            ...state.uiPreferences,
            theme
          }
        })),
      setCompactMode: (compactMode) =>
        set((state) => ({
          uiPreferences: {
            ...state.uiPreferences,
            compactMode
          }
        })),
      setUsePriorityRanking: (enabled) =>
        set((state) => ({
          uiPreferences: {
            ...state.uiPreferences,
            usePriorityRanking: enabled
          }
        })),
      setExportPreference: (key, value) =>
        set((state) => ({
          uiPreferences: {
            ...state.uiPreferences,
            exportPreferences: {
              ...state.uiPreferences.exportPreferences,
              [key]: value
            }
          }
        })),
      addSlot: () => set({ slots: defaultSlots }),
      updateSlot: () => set({ slots: defaultSlots }),
      deleteSlot: () => set({ slots: defaultSlots }),
      clearSlots: () => set({ slots: defaultSlots }),
      applySlotPreset: () => set({ slots: defaultSlots }),
      importSlotsFromCsv: () => 0,
      addCourse: (course) =>
        set((state) => ({
          courses: [
            ...state.courses,
            {
              ...course,
              id: nanoid(),
              color: colorForIndex(state.courses.length),
              options: []
            }
          ]
        })),
      updateCourse: (courseId, patch) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId ? { ...course, ...patch } : course
          )
        })),
      deleteCourse: (courseId) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== courseId),
          constraints: {
            ...state.constraints,
            professorLocks: state.constraints.professorLocks.filter(
              (lock) => !lock.startsWith(`${courseId}:`)
            )
          }
        })),
      duplicateCourse: (courseId) =>
        set((state) => {
          const course = state.courses.find((item) => item.id === courseId);
          if (!course) {
            return state;
          }
          return {
            courses: [
              ...state.courses,
              {
                ...course,
                id: nanoid(),
                courseCode: course.courseCode
                  ? `${course.courseCode}-COPY`
                  : "COURSE-COPY",
                color: colorForIndex(state.courses.length),
                options: course.options.map((option) => ({
                  ...cleanOption(option),
                  id: nanoid()
                }))
              }
            ]
          };
        }),
      moveCourse: (courseId, direction) =>
        set((state) => {
          const courses = [...state.courses];
          const index = courses.findIndex((course) => course.id === courseId);
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (index < 0 || targetIndex < 0 || targetIndex >= courses.length) {
            return state;
          }
          const [course] = courses.splice(index, 1);
          courses.splice(targetIndex, 0, course);
          return { courses };
        }),
      addOption: (courseId, option) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  options: [
                    ...course.options,
                    { ...cleanOption(option as CourseOption), id: nanoid() }
                  ]
                }
              : course
          )
        })),
      updateOption: (courseId, optionId, patch) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  options: course.options.map((option) =>
                    option.id === optionId
                      ? cleanOption({ ...option, ...patch })
                      : option
                  )
                }
              : course
          )
        })),
      deleteOption: (courseId, optionId) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  options: course.options.filter((option) => option.id !== optionId)
                }
              : course
          ),
          constraints: {
            ...state.constraints,
            professorLocks: state.constraints.professorLocks.filter(
              (lock) => lock !== `${courseId}:${optionId}`
            )
          }
        })),
      duplicateOption: (courseId, optionId) =>
        set((state) => ({
          courses: state.courses.map((course) => {
            if (course.id !== courseId) {
              return course;
            }
            const option = course.options.find((item) => item.id === optionId);
            if (!option) {
              return course;
            }
            return {
              ...course,
              options: [
                ...course.options,
                {
                  ...cleanOption(option),
                  id: nanoid(),
                  professorName: `${option.professorName} copy`
                }
              ]
            };
          })
        })),
      moveOption: (courseId, optionId, direction) =>
        set((state) => ({
          courses: state.courses.map((course) => {
            if (course.id !== courseId) {
              return course;
            }
            const options = [...course.options];
            const index = options.findIndex((option) => option.id === optionId);
            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (index < 0 || targetIndex < 0 || targetIndex >= options.length) {
              return course;
            }
            const [option] = options.splice(index, 1);
            options.splice(targetIndex, 0, option);
            return { ...course, options };
          })
        })),
      toggleProfessorLock: (courseId, optionId) =>
        set((state) => {
          const value = `${courseId}:${optionId}`;
          const professorLocks = state.constraints.professorLocks.includes(value)
            ? state.constraints.professorLocks.filter((lock) => lock !== value)
            : [...state.constraints.professorLocks, value];
          return {
            constraints: {
              ...state.constraints,
              professorLocks
            }
          };
        }),
      setConstraint: (key, value) =>
        set((state) => ({
          constraints: normalizeImportedConstraints({
            ...state.constraints,
            [key]: value
          })
        })),
      addBlockedWindow: (blockedWindow) =>
        set((state) => ({
          constraints: {
            ...state.constraints,
            blockedWindows: [
              ...state.constraints.blockedWindows,
              { ...blockedWindow, id: nanoid() }
            ]
          }
        })),
      updateBlockedWindow: (blockedWindowId, patch) =>
        set((state) => ({
          constraints: {
            ...state.constraints,
            blockedWindows: state.constraints.blockedWindows.map((blockedWindow) =>
              blockedWindow.id === blockedWindowId
                ? { ...blockedWindow, ...patch }
                : blockedWindow
            )
          }
        })),
      deleteBlockedWindow: (blockedWindowId) =>
        set((state) => ({
          constraints: {
            ...state.constraints,
            blockedWindows: state.constraints.blockedWindows.filter(
              (blockedWindow) => blockedWindow.id !== blockedWindowId
            )
          }
        })),
      resetConstraints: () => set({ constraints: defaultConstraints }),
      setGeneratedSchedules: (schedules) =>
        set({
          generatedSchedules: schedules,
          activeScheduleId: schedules[0]?.id ?? null,
          compareScheduleIds: schedules.slice(0, 2).map((schedule) => schedule.id)
        }),
      setActiveScheduleId: (scheduleId) => set({ activeScheduleId: scheduleId }),
      saveSchedule: (schedule, name) =>
        set((state) => {
          const existing = state.savedSchedules.find(
            (saved) => saved.timetable.id === schedule.id
          );
          const now = new Date().toISOString();
          if (existing) {
            return {
              savedSchedules: state.savedSchedules.map((saved) =>
                saved.id === existing.id
                  ? { ...saved, updatedAt: now, timetable: schedule }
                  : saved
              )
            };
          }
          return {
            savedSchedules: [
              {
                id: nanoid(),
                name:
                  name ??
                  `${schedule.rankingMode} schedule ${state.savedSchedules.length + 1}`,
                createdAt: now,
                updatedAt: now,
                favorite: false,
                timetable: schedule
              },
              ...state.savedSchedules
            ]
          };
        }),
      deleteSavedSchedule: (savedId) =>
        set((state) => ({
          savedSchedules: state.savedSchedules.filter((saved) => saved.id !== savedId)
        })),
      renameSavedSchedule: (savedId, name) =>
        set((state) => ({
          savedSchedules: state.savedSchedules.map((saved) =>
            saved.id === savedId
              ? { ...saved, name, updatedAt: new Date().toISOString() }
              : saved
          )
        })),
      toggleFavoriteSchedule: (savedId) =>
        set((state) => ({
          savedSchedules: state.savedSchedules.map((saved) =>
            saved.id === savedId ? { ...saved, favorite: !saved.favorite } : saved
          )
        })),
      addCompareSchedule: (scheduleId) =>
        set((state) => ({
          compareScheduleIds: Array.from(
            new Set([...state.compareScheduleIds, scheduleId])
          ).slice(-3)
        })),
      removeCompareSchedule: (scheduleId) =>
        set((state) => ({
          compareScheduleIds: state.compareScheduleIds.filter((id) => id !== scheduleId)
        })),
      clearCompare: () => set({ compareScheduleIds: [] }),
      applySharedState: (sharedState) =>
        set((state) => ({
          slots: defaultSlots,
          courses: sharedState.courses.map((course) => ({
            ...course,
            options: course.options.map(cleanOption)
          })),
          constraints: normalizeImportedConstraints(sharedState.constraints),
          rankingMode:
            sharedState.rankingMode === "Free-Day Focused"
              ? "Balanced"
              : sharedState.rankingMode,
          generatedSchedules: sharedState.activeSchedule ? [sharedState.activeSchedule] : [],
          activeScheduleId: sharedState.activeSchedule?.id ?? null,
          uiPreferences: {
            ...state.uiPreferences,
            usePriorityRanking:
              sharedState.usePriorityRanking ?? state.uiPreferences.usePriorityRanking
          }
        })),
      resetAll: () =>
        set({
          slots: defaultSlots,
          courses: [],
          constraints: defaultConstraints,
          generatedSchedules: [],
          activeScheduleId: null,
          savedSchedules: [],
          compareScheduleIds: [],
          rankingMode: "Balanced",
          uiPreferences: defaultUiPreferences
        })
    }),
    {
      name: "unitime-pro-state",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        courses: state.courses,
        constraints: state.constraints,
        savedSchedules: state.savedSchedules,
        rankingMode: state.rankingMode,
        uiPreferences: state.uiPreferences
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<UniTimeStore> | undefined;
        return {
          slots: defaultSlots,
          courses: [],
          constraints: defaultConstraints,
          generatedSchedules: [],
          activeScheduleId: null,
          savedSchedules: [],
          compareScheduleIds: [],
          rankingMode:
            state?.rankingMode === "Free-Day Focused"
              ? "Balanced"
              : state?.rankingMode ?? "Balanced",
          uiPreferences: {
            ...defaultUiPreferences,
            ...state?.uiPreferences,
            usePriorityRanking:
              state?.uiPreferences?.usePriorityRanking ??
              defaultUiPreferences.usePriorityRanking
          },
          hasHydrated: false
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.slots = defaultSlots;
          state.constraints = normalizeImportedConstraints(state.constraints);
          state.setHasHydrated(true);
        }
      }
    }
  )
);

export function getAllSchedules(
  state: Pick<UniTimeStore, "generatedSchedules" | "savedSchedules">
) {
  const generated = Array.isArray(state.generatedSchedules) ? state.generatedSchedules : [];
  const savedSchedules = Array.isArray(state.savedSchedules) ? state.savedSchedules : [];
  const saved = savedSchedules
    .map((item) => item?.timetable)
    .filter((schedule): schedule is ScoredTimetable => Boolean(schedule));

  const byId = new Map<string, ScoredTimetable>();
  [...generated, ...saved].forEach((schedule) => {
    byId.set(schedule.id, schedule);
  });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score);
}
