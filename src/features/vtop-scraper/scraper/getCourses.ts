import { parseCourseOption } from "./getCurriculumCategories";
import type { CourseEntry } from "./internal";

export function getCourses(select: HTMLSelectElement): CourseEntry[] {
  const courses: CourseEntry[] = [];

  for (const opt of select.options) {
    const value = opt.value;
    const label = opt.textContent?.trim() ?? "";
    if (!value || value === "0" || value === "-1") continue;
    if (!label || /^select|^choose|^--/i.test(label)) continue;

    const parsed = parseCourseOption(opt);
    if (!parsed) continue;

    courses.push({
      value,
      code: parsed.code,
      name: parsed.name,
      label,
    });
  }

  return courses;
}
