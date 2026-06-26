import { setSelectValue } from "./dom";
import type { CourseEntry } from "./internal";
import { waitForNetworkIdle } from "./wait";

export async function selectCourse(
  select: HTMLSelectElement,
  course: CourseEntry,
  waitForTable: () => Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  setSelectValue(select, course.value);
  await waitForTable();
  await waitForNetworkIdle(300, signal);
}
