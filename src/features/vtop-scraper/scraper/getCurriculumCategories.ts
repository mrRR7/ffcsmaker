import { COURSE_CODE_RE, type CurriculumCategory } from "./internal";

export function getCurriculumCategories(select: HTMLSelectElement): CurriculumCategory[] {
  const categories: CurriculumCategory[] = [];

  for (const opt of select.options) {
    const value = opt.value;
    const label = opt.textContent?.trim() ?? "";
    if (!value || value === "0" || value === "-1") continue;
    if (!label || /^select|^choose|^--/i.test(label)) continue;
    categories.push({ value, label });
  }

  return categories;
}

export function parseCourseOption(opt: HTMLOptionElement): {
  code: string;
  name: string;
} | null {
  const text = opt.textContent?.trim() ?? "";
  const fromText = text.match(COURSE_CODE_RE);
  if (fromText) {
    return { code: fromText[1].toUpperCase(), name: fromText[2].trim() };
  }

  const fromValue = opt.value.match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/i);
  if (fromValue) {
    return { code: fromValue[1].toUpperCase(), name: text || fromValue[1].toUpperCase() };
  }

  return null;
}
