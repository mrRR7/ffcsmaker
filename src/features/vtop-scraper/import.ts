import type { CourseOptionInput } from "@/features/courses/mergeCourseOptions";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { getSlotCatalog } from "@/engine/slotCatalog";
import { useAppStore } from "@/store/useAppStore";
import type { PlannerImportJSON } from "./types";

export type { VtopCatalogDiff } from "@/lib/vtopImport/compareCatalog";

export function parseVtopPayload(raw: unknown): PlannerImportJSON {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid planner JSON.");
  }

  const payload = raw as PlannerImportJSON;
  if (!Array.isArray(payload.courses)) {
    throw new Error("Invalid planner JSON.");
  }

  return payload;
}

export function payloadToCourseInputs(payload: PlannerImportJSON): CourseOptionInput[] {
  const inputs: CourseOptionInput[] = [];

  for (const course of payload.courses) {
    const code = course.courseCode?.trim();
    if (!code) continue;

    const name = course.courseName || code;
    const courseCredits = Number(course.credits) || 3;

    for (const option of course.options) {
      const professor = option.professorName?.trim();
      if (!professor) continue;

      inputs.push({
        courseCode: code,
        courseName: name,
        credits: Number(option.credits) || courseCredits,
        professorName: professor,
        program: option.program ?? null,
        theorySlotsRaw: Array.isArray(option.theorySlots)
          ? option.theorySlots.join("+")
          : "",
        labSlotsRaw: Array.isArray(option.labSlots) ? option.labSlots.join("+") : "",
        notes: option.notes ?? "",
      });
    }
  }

  return inputs;
}

export function applyVtopImport(payload: PlannerImportJSON) {
  const inputs = payloadToCourseInputs(payload);
  if (inputs.length === 0) {
    throw new Error("No course options to import.");
  }

  const state = useAppStore.getState();
  const slots = state.slots.length > 0 ? state.slots : getSlotCatalog("standard");
  const result = mergeCourseOptions(state.courses, inputs, slots);
  state.setCourses(result.courses);

  return {
    addedCourses: result.addedCourses,
    addedOptions: result.addedOptions,
    courseCount: payload.courses.length,
  };
}

export function isImportToken(value: string | null): value is string {
  if (!value) return false;
  return /^[A-Za-z0-9_-]{8,24}$/.test(value);
}
