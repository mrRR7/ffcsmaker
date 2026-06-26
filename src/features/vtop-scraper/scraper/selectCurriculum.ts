import { setSelectValue } from "./dom";
import type { CurriculumCategory } from "./internal";
import { waitForCourseListUpdate, waitForNetworkIdle } from "./wait";

export async function selectCurriculum(
  select: HTMLSelectElement,
  category: CurriculumCategory,
  courseSelect: HTMLSelectElement,
  signal?: AbortSignal
): Promise<void> {
  const previousFingerprint = Array.from(courseSelect.options)
    .map((o) => `${o.value}\0${o.textContent?.trim() ?? ""}`)
    .join("\n");

  setSelectValue(select, category.value);

  await waitForCourseListUpdate(courseSelect, previousFingerprint, signal);
  await waitForNetworkIdle(300, signal);
}
