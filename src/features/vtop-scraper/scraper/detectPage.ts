import {
  findCourseSelect,
  findCurriculumSelect,
  hasAllocationTable,
  isVtopDomain,
} from "./dom";
import type { PageDetection } from "./internal";

export function detectPage(): PageDetection {
  if (!isVtopDomain()) return { mode: "none" };

  const courseSelect = findCourseSelect();
  const curriculumSelect = findCurriculumSelect(courseSelect);

  if (courseSelect && curriculumSelect) {
    return { mode: "dropdown", curriculumSelect, courseSelect };
  }

  if (hasAllocationTable()) {
    return { mode: "table" };
  }

  return { mode: "none" };
}

export function isCourseRegistrationPage(): boolean {
  const detection = detectPage();
  return detection.mode !== "none";
}

export { isVtopDomain } from "./dom";
