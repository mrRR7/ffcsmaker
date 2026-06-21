"use client";

import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BlockedWindow,
  CAMPUS_SLOT_VARIANT,
  Campus,
  Constraints,
  Course,
  CourseOption,
  DayOfWeek,
  Program,
  RankingMode,
  SavedSchedule,
  ScoredTimetable,
  SharedPlannerState,
  SlotVariant,
  TimeSlot,
  TimetableShapeGroup,
  UiPreferences
} from "@/engine/types";
import { clearCampusCache } from "@/lib/catalogCache";
import { checkStorageCapacity } from "@/lib/storageUtils";
import { getSlotCatalog, getSlotDays } from "@/engine/slotCatalog";
import { groupSchedulesByShape } from "@/engine/consolidation";
import { mapLegacyRankingMode } from "@/engine/ranking";

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

const GENERATION_TTL_MS = 24 * 60 * 60 * 1000;

export const defaultSlots = getSlotCatalog("standard");

export const defaultConstraints: Constraints = {
  blockedWindows: [],
  noAfterTime: null,
  avoidFirstPeriod: false,
  avoidLastPeriod: false,
  preferredDaysOff: [],
  maxGapSlots: null,
  maxClassesPerDay: null,
  requireMinFreeDays: null,
  minimizeDays: false,
  preferCompactness: false,
  preferHalfDays: false,
  preferEarlyFinish: false,
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
        : null),
    earliestStart: constraints?.earliestStart ?? null,
    latestEnd: constraints?.latestEnd ?? null,
    startAfterByDay: constraints?.startAfterByDay ?? {},
    latestEndByDay: constraints?.latestEndByDay ?? {},
    facultyRanking: constraints?.facultyRanking ?? {},
    avoidedFacultyByCourse: constraints?.avoidedFacultyByCourse ?? {}
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
  campus: Campus | null;
  program: Program | null;
  slotVariant: SlotVariant;
  generatedSchedules: ScoredTimetable[];
  generatedShapeGroups: TimetableShapeGroup[];
  generatedAt: number | null;
  activeShapeId: string | null;
  activeVariantId: string | null;
  savedSchedules: SavedSchedule[];
  compareScheduleIds: string[];
  rankingMode: RankingMode;
  uiPreferences: UiPreferences;
  hasHydrated: boolean;
  getActiveDays: () => readonly DayOfWeek[];
  setHasHydrated: (value: boolean) => void;
  setCampus: (campus: Campus) => void;
  setProgram: (program: Program | null) => void;
  resetCampus: () => void;
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
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, "id" | "options" | "color">) => void;
  updateCourse: (courseId: string, patch: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  clearCourses: () => void;
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
  reorderOptions: (courseId: string, newOrderedIds: string[]) => void;
  toggleProfessorLock: (courseId: string, optionId: string) => void;
  setConstraint: <K extends keyof Constraints>(key: K, value: Constraints[K]) => void;
  addBlockedWindow: (blockedWindow: Omit<BlockedWindow, "id">) => void;
  updateBlockedWindow: (
    blockedWindowId: string,
    patch: Partial<BlockedWindow>
  ) => void;
  deleteBlockedWindow: (blockedWindowId: string) => void;
  resetConstraints: () => void;
  setFacultyRanking: (courseId: string, optionIds: string[]) => void;
  setAvoidedFaculty: (courseId: string, optionIds: string[]) => void;
  setGeneratedSchedules: (schedules: ScoredTimetable[]) => void;
  setActiveShapeId: (shapeId: string | null) => void;
  setActiveVariantId: (variantId: string | null) => void;
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
    (set, get) => ({
      slots: defaultSlots,
      courses: [],
      constraints: defaultConstraints,
      campus: null,
      program: null,
      slotVariant: "standard",
      generatedSchedules: [],
      generatedShapeGroups: [],
      generatedAt: null,
      activeShapeId: null,
      activeVariantId: null,
      savedSchedules: [],
      compareScheduleIds: [],
      rankingMode: "Balanced",
      uiPreferences: defaultUiPreferences,
      hasHydrated: false,
      getActiveDays: () => getSlotDays(get().slotVariant ?? "standard"),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setCampus: (campus) =>
        set((state) => {
          if (state.campus) {
            clearCampusCache(state.campus);
          }
          const variant = CAMPUS_SLOT_VARIANT[campus];
          return {
            campus,
            slotVariant: variant,
            slots: getSlotCatalog(variant),
            courses: [],
            generatedSchedules: [],
            generatedShapeGroups: [],
            generatedAt: null,
            activeShapeId: null,
            activeVariantId: null,
            compareScheduleIds: [],
            constraints: defaultConstraints,
            program: null
          };
        }),
      setProgram: (program) =>
        set({
          program,
          courses: [],
          generatedSchedules: [],
          activeShapeId: null,
          activeVariantId: null,
          generatedAt: null,
        }),
      resetCampus: () =>
        set((state) => {
          if (state.campus) {
            clearCampusCache(state.campus);
          }
          return {
            campus: null,
            program: null,
            slotVariant: "standard",
            slots: getSlotCatalog("standard"),
            courses: [],
            generatedSchedules: [],
            generatedShapeGroups: [],
            generatedAt: null,
            activeShapeId: null,
            activeVariantId: null,
            compareScheduleIds: [],
            constraints: defaultConstraints
          };
        }),
      setRankingMode: (mode) => {
        const mapped = mapLegacyRankingMode(mode);
        set((state) => ({
          rankingMode: mapped,
          uiPreferences: {
            ...state.uiPreferences,
            defaultRankingMode: mapped
          }
        }));
      },
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
      setCourses: (courses) => set({ courses }),
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
        set((state) => {
          const newRanking = { ...state.constraints.facultyRanking };
          const newAvoided = { ...state.constraints.avoidedFacultyByCourse };
          delete newRanking[courseId];
          delete newAvoided[courseId];
          return {
            courses: state.courses.filter((course) => course.id !== courseId),
            generatedSchedules: [],
            generatedShapeGroups: [],
            generatedAt: null,
            activeShapeId: null,
            activeVariantId: null,
            constraints: {
              ...state.constraints,
              professorLocks: state.constraints.professorLocks.filter(
                (lock) => !lock.startsWith(`${courseId}:`)
              ),
              facultyRanking: newRanking,
              avoidedFacultyByCourse: newAvoided
            }
          };
        }),
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
      clearCourses: () =>
        set((state) => ({
          courses: [],
          generatedSchedules: [],
          generatedShapeGroups: [],
          generatedAt: null,
          activeShapeId: null,
          activeVariantId: null,
          compareScheduleIds: [],
          constraints: {
            ...state.constraints,
            professorLocks: [],
            facultyRanking: {},
            avoidedFacultyByCourse: {}
          }
        })),
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
        set((state) => {
          const newOptionId = nanoid();
          const existingRanking = state.constraints.facultyRanking[courseId];
          const newRanking = { ...state.constraints.facultyRanking };
          if (existingRanking && existingRanking.length > 0) {
            newRanking[courseId] = [...existingRanking, newOptionId];
          }
          return {
            courses: state.courses.map((course) =>
              course.id === courseId
                ? {
                    ...course,
                    options: [
                      ...course.options,
                      { ...cleanOption(option as CourseOption), id: newOptionId }
                    ]
                  }
                : course
            ),
            constraints: {
              ...state.constraints,
              facultyRanking: newRanking
            }
          };
        }),
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
        set((state) => {
          const existingRanking = state.constraints.facultyRanking[courseId];
          const newRanking = { ...state.constraints.facultyRanking };
          if (existingRanking) {
            newRanking[courseId] = existingRanking.filter((id) => id !== optionId);
          }
          const existingAvoided = state.constraints.avoidedFacultyByCourse[courseId];
          const newAvoided = { ...state.constraints.avoidedFacultyByCourse };
          if (existingAvoided) {
            newAvoided[courseId] = existingAvoided.filter((id) => id !== optionId);
          }
          return {
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
              ),
              facultyRanking: newRanking,
              avoidedFacultyByCourse: newAvoided
            }
          };
        }),
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
      reorderOptions: (courseId, newOrderedIds) =>
        set((state) => {
          const course = state.courses.find((c) => c.id === courseId);
          if (!course) return state;
          // Reorder options array to match the new ID order
          const optionMap = new Map(course.options.map((o) => [o.id, o]));
          const reordered = newOrderedIds
            .map((id) => optionMap.get(id))
            .filter((o): o is CourseOption => Boolean(o));
          // Sync facultyRanking to the same order so scoreSchedule stays consistent
          const existingRanking = state.constraints.facultyRanking[courseId];
          const newRankingOrder = existingRanking
            ? newOrderedIds.filter((id) => existingRanking.includes(id))
            : newOrderedIds;
          return {
            courses: state.courses.map((c) =>
              c.id === courseId ? { ...c, options: reordered } : c
            ),
            constraints: {
              ...state.constraints,
              facultyRanking: {
                ...state.constraints.facultyRanking,
                [courseId]: newRankingOrder
              }
            }
          };
        }),
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
      setFacultyRanking: (courseId, optionIds) =>
        set((state) => ({
          constraints: {
            ...state.constraints,
            facultyRanking: {
              ...state.constraints.facultyRanking,
              [courseId]: optionIds
            }
          }
        })),
      setAvoidedFaculty: (courseId, optionIds) =>
        set((state) => ({
          constraints: {
            ...state.constraints,
            avoidedFacultyByCourse: {
              ...state.constraints.avoidedFacultyByCourse,
              [courseId]: optionIds
            }
          }
        })),
      setGeneratedSchedules: (schedules) =>
        set((state) => {
          const generatedShapeGroups = groupSchedulesByShape(schedules, state.slots);
          return {
            generatedSchedules: schedules,
            generatedShapeGroups,
            generatedAt: Date.now(),
            activeShapeId: generatedShapeGroups[0]?.shapeId ?? null,
            activeVariantId: generatedShapeGroups[0]?.representative.id ?? null,
            compareScheduleIds: schedules.slice(0, 2).map((schedule) => schedule.id)
          };
        }),
      setActiveShapeId: (shapeId) => set({ activeShapeId: shapeId }),
      setActiveVariantId: (variantId) => set({ activeVariantId: variantId }),
      saveSchedule: (schedule, name) =>
        set((state) => {
          const { isNearLimit } = checkStorageCapacity();
          if (isNearLimit) {
            toast.error(
              "Storage nearly full. Consider deleting old saved timetables.",
              { duration: 6000 }
            );
          }
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
            saved.id === savedId || saved.timetable.id === savedId
              ? { ...saved, favorite: !saved.favorite }
              : saved
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
        set((state) => {
          const slots = state.campus
            ? getSlotCatalog(CAMPUS_SLOT_VARIANT[state.campus])
            : defaultSlots;
          const slotVariant = state.campus
            ? CAMPUS_SLOT_VARIANT[state.campus]
            : "standard";
          const generatedShapeGroups = sharedState.activeSchedule
            ? groupSchedulesByShape([sharedState.activeSchedule], slots)
            : [];
          return {
            slotVariant,
            slots,
            courses: sharedState.courses.map((course) => ({
              ...course,
              options: course.options.map(cleanOption)
            })),
            constraints: normalizeImportedConstraints(sharedState.constraints),
            rankingMode: mapLegacyRankingMode(sharedState.rankingMode),
            generatedSchedules: sharedState.activeSchedule
              ? [sharedState.activeSchedule]
              : [],
            generatedShapeGroups,
            generatedAt: sharedState.activeSchedule ? Date.now() : null,
            activeShapeId: generatedShapeGroups[0]?.shapeId ?? null,
            activeVariantId: sharedState.activeSchedule?.id ?? null,
            uiPreferences: {
              ...state.uiPreferences,
              usePriorityRanking:
                sharedState.usePriorityRanking ?? state.uiPreferences.usePriorityRanking
            }
          };
        }),
      resetAll: () =>
        set({
          slots: defaultSlots,
          courses: [],
          constraints: defaultConstraints,
          campus: null,
          program: null,
          slotVariant: "standard",
          generatedSchedules: [],
          generatedShapeGroups: [],
          generatedAt: null,
          activeShapeId: null,
          activeVariantId: null,
          savedSchedules: [],
          compareScheduleIds: [],
          rankingMode: "Balanced",
          uiPreferences: defaultUiPreferences
        })
    }),
    {
      name: "unitime-pro-state",
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const generationIsRecent =
          state.generatedAt !== null && Date.now() - state.generatedAt < GENERATION_TTL_MS;

        return {
          courses: state.courses,
          constraints: state.constraints,
          savedSchedules: state.savedSchedules,
          rankingMode: state.rankingMode,
          uiPreferences: state.uiPreferences,
          campus: state.campus,
          program: state.program,
          slotVariant: state.slotVariant,
          generatedAt: generationIsRecent ? state.generatedAt : null,
          generatedSchedules: generationIsRecent ? state.generatedSchedules : [],
          generatedShapeGroups: generationIsRecent ? state.generatedShapeGroups : [],
          activeShapeId: generationIsRecent ? state.activeShapeId : null,
          activeVariantId: generationIsRecent ? state.activeVariantId : null,
          compareScheduleIds: generationIsRecent ? state.compareScheduleIds : []
        };
      },
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<UniTimeStore> | undefined;
        const campus = version >= 4 ? state?.campus ?? null : null;
        const program = version >= 5 ? state?.program ?? null : null;
        const slots = campus
          ? getSlotCatalog(CAMPUS_SLOT_VARIANT[campus])
          : defaultSlots;
        const slotVariant = campus ? CAMPUS_SLOT_VARIANT[campus] : "standard";
        const generationIsRecent =
          typeof state?.generatedAt === "number" &&
          Date.now() - state.generatedAt < GENERATION_TTL_MS;
        const generatedSchedules = generationIsRecent
          ? state?.generatedSchedules ?? []
          : [];
        const generatedShapeGroups =
          generationIsRecent && state?.generatedShapeGroups?.length
            ? state.generatedShapeGroups
            : groupSchedulesByShape(generatedSchedules, slots);

        return {
          slots,
          courses: (state?.courses ?? []).map((course) => ({
            ...course,
            options: course.options.map(cleanOption)
          })),
          constraints: normalizeImportedConstraints(state?.constraints),
          campus,
          program,
          slotVariant,
          generatedSchedules,
          generatedShapeGroups,
          generatedAt: generationIsRecent ? state?.generatedAt ?? null : null,
          activeShapeId: generationIsRecent
            ? state?.activeShapeId ?? generatedShapeGroups[0]?.shapeId ?? null
            : null,
          activeVariantId: generationIsRecent
            ? state?.activeVariantId ??
              generatedShapeGroups[0]?.representative.id ??
              null
            : null,
          savedSchedules: state?.savedSchedules ?? [],
          compareScheduleIds: generationIsRecent
            ? state?.compareScheduleIds ?? []
            : [],
          rankingMode: mapLegacyRankingMode(state?.rankingMode),
          uiPreferences: {
            ...defaultUiPreferences,
            ...state?.uiPreferences,
            defaultRankingMode: mapLegacyRankingMode(
              state?.uiPreferences?.defaultRankingMode ?? state?.rankingMode
            ),
            usePriorityRanking:
              state?.uiPreferences?.usePriorityRanking ??
              defaultUiPreferences.usePriorityRanking
          },
          hasHydrated: false
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.slots = state.campus
            ? getSlotCatalog(CAMPUS_SLOT_VARIANT[state.campus])
            : defaultSlots;
          state.slotVariant = state.campus
            ? CAMPUS_SLOT_VARIANT[state.campus]
            : "standard";
          state.constraints = normalizeImportedConstraints(state.constraints);
          const generationIsRecent =
            typeof state.generatedAt === "number" &&
            Date.now() - state.generatedAt < GENERATION_TTL_MS;
          if (!generationIsRecent) {
            state.generatedSchedules = [];
            state.generatedShapeGroups = [];
            state.generatedAt = null;
            state.activeShapeId = null;
            state.activeVariantId = null;
            state.compareScheduleIds = [];
          } else {
            state.generatedShapeGroups = groupSchedulesByShape(
              state.generatedSchedules,
              state.slots
            );
            state.activeShapeId =
              state.activeShapeId ?? state.generatedShapeGroups[0]?.shapeId ?? null;
            state.activeVariantId =
              state.activeVariantId ??
              state.generatedShapeGroups[0]?.representative.id ??
              null;
          }
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
