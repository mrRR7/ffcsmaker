import type { PlannerImportJSON } from "../types";
import { detectPage } from "./detectPage";
import { getCurriculumCategories } from "./getCurriculumCategories";
import { getCourses } from "./getCourses";
import { selectCurriculum } from "./selectCurriculum";
import { selectCourse } from "./selectCourse";
import {
  getAllocationSignature,
  scrapeCurrentCourse,
  scrapeVisibleAllocation,
} from "./scrapeCurrentCourse";
import {
  countCollectedCourses,
  countCollectedOptions,
  countDuplicateOptions,
  mergeRawRows,
} from "./mergeResults";
import { aggregateRows } from "./parse";
import type {
  AutomatedScrapeResult,
  CurriculumCategory,
  FailedCourseEntry,
  ScrapeProgress,
  VtopRawRow,
} from "./internal";
import { waitForAllocationTable, ScrapeCancelledError } from "./wait";

export type ProgressCallback = (progress: ScrapeProgress) => void;

function estimateSecondsRemaining(
  startTime: number,
  completed: number,
  total: number
): number | null {
  if (completed <= 0 || total <= 0) return null;
  const elapsedMs = Date.now() - startTime;
  const avgMs = elapsedMs / completed;
  const remaining = Math.max(0, total - completed);
  return Math.ceil((remaining * avgMs) / 1000);
}

function makeProgress(
  partial: Partial<ScrapeProgress> & Pick<ScrapeProgress, "phase">
): ScrapeProgress {
  return {
    curriculumLabel: "",
    curriculumIndex: 0,
    curriculumTotal: 0,
    courseLabel: "",
    courseIndex: 0,
    courseTotal: 0,
    coursesCollected: 0,
    optionsCollected: 0,
    estimatedSecondsRemaining: null,
    failedCount: 0,
    duplicateCount: 0,
    ...partial,
  };
}

async function scrapeCourseList(
  curriculumSelect: HTMLSelectElement,
  courseSelect: HTMLSelectElement,
  categories: CurriculumCategory[],
  onProgress: ProgressCallback,
  signal: AbortSignal | undefined,
  startTime: number,
  initialRows: VtopRawRow[],
  initialFailed: FailedCourseEntry[]
): Promise<AutomatedScrapeResult> {
  let rows = [...initialRows];
  const failedCourses = [...initialFailed];
  let globalCourseIndex = 0;
  let discoveredCourseTotal = 0;
  let lastSignature = getAllocationSignature(rows);

  for (let ci = 0; ci < categories.length; ci++) {
    const category = categories[ci]!;

    try {
      await selectCurriculum(curriculumSelect, category, courseSelect, signal);
    } catch (error) {
      if (error instanceof ScrapeCancelledError) throw error;
      console.error("[Ultimate FFCS] Curriculum category failed:", category.label, error);
      continue;
    }

    const courses = getCourses(courseSelect);
    discoveredCourseTotal += courses.length;

    for (let coi = 0; coi < courses.length; coi++) {
      const course = courses[coi]!;
      globalCourseIndex++;

      onProgress(
        makeProgress({
          phase: "scraping",
          curriculumLabel: category.label,
          curriculumIndex: ci + 1,
          curriculumTotal: categories.length,
          courseLabel: course.name,
          courseIndex: globalCourseIndex,
          courseTotal: discoveredCourseTotal,
          coursesCollected: countCollectedCourses(rows),
          optionsCollected: countCollectedOptions(rows),
          estimatedSecondsRemaining: estimateSecondsRemaining(
            startTime,
            globalCourseIndex - 1,
            discoveredCourseTotal
          ),
          failedCount: failedCourses.length,
          duplicateCount: countDuplicateOptions(rows),
        })
      );

      try {
        await selectCourse(courseSelect, course, async () => {
          await waitForAllocationTable(
            lastSignature,
            () => getAllocationSignature(scrapeCurrentCourse(course)),
            signal
          );
        }, signal);

        const scraped = scrapeCurrentCourse(course);
        if (scraped.length === 0) {
          throw new Error("No faculty allocation rows found.");
        }

        lastSignature = getAllocationSignature(scraped);
        rows = mergeRawRows(rows, scraped);
      } catch (error) {
        if (error instanceof ScrapeCancelledError) throw error;
        failedCourses.push({
          category,
          course,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error("[Ultimate FFCS] Course failed:", course.code, error);
      }
    }
  }

  return {
    rows,
    failedCourses,
    duplicateCount: countDuplicateOptions(rows),
    totalCoursesAttempted: globalCourseIndex,
  };
}

export async function runAutomatedScrape(
  onProgress: ProgressCallback,
  options: {
    signal?: AbortSignal;
    retryOnly?: FailedCourseEntry[];
    existingRows?: VtopRawRow[];
  } = {}
): Promise<{ result: PlannerImportJSON; scrapeMeta: AutomatedScrapeResult }> {
  const detection = detectPage();
  if (detection.mode === "none") {
    throw new Error("NOT_REGISTRATION_PAGE");
  }

  const startTime = Date.now();
  onProgress(makeProgress({ phase: "scraping" }));

  if (detection.mode === "table") {
    const rows = scrapeVisibleAllocation();
    if (rows.length === 0) {
      throw new Error("NO_DATA");
    }
    const payload = aggregateRows(rows);
    const scrapeMeta: AutomatedScrapeResult = {
      rows,
      failedCourses: [],
      duplicateCount: countDuplicateOptions(rows),
      totalCoursesAttempted: countCollectedCourses(rows),
    };
    onProgress(
      makeProgress({
        phase: "complete",
        coursesCollected: payload.courses.length,
        optionsCollected: payload.courses.reduce((s, c) => s + c.options.length, 0),
        duplicateCount: scrapeMeta.duplicateCount,
      })
    );
    return { result: payload, scrapeMeta };
  }

  const { curriculumSelect, courseSelect } = detection;
  const categories = getCurriculumCategories(curriculumSelect);

  if (categories.length === 0) {
    throw new Error("NO_CURRICULUM_CATEGORIES");
  }

  let scrapeResult: AutomatedScrapeResult;

  if (options.retryOnly && options.retryOnly.length > 0) {
    const totalCourses = options.retryOnly.length;
    const rows: VtopRawRow[] = [...(options.existingRows ?? [])];
    const failedCourses: FailedCourseEntry[] = [];
    let completed = 0;

    for (const entry of options.retryOnly) {
      onProgress(
        makeProgress({
          phase: "scraping",
          curriculumLabel: entry.category.label,
          curriculumIndex: 1,
          curriculumTotal: 1,
          courseLabel: entry.course.name,
          courseIndex: completed + 1,
          courseTotal: totalCourses,
          coursesCollected: countCollectedCourses(rows),
          optionsCollected: countCollectedOptions(rows),
          estimatedSecondsRemaining: estimateSecondsRemaining(startTime, completed, totalCourses),
          failedCount: failedCourses.length,
        })
      );

      try {
        await selectCurriculum(curriculumSelect, entry.category, courseSelect, options.signal);
        let lastSignature = "";
        await selectCourse(
          courseSelect,
          entry.course,
          async () => {
            await waitForAllocationTable(
              lastSignature,
              () => getAllocationSignature(scrapeCurrentCourse(entry.course)),
              options.signal
            );
          },
          options.signal
        );
        const scraped = scrapeCurrentCourse(entry.course);
        if (scraped.length === 0) throw new Error("No faculty allocation rows found.");
        rows.push(...scraped);
        completed++;
      } catch (error) {
        if (error instanceof ScrapeCancelledError) throw error;
        failedCourses.push({
          ...entry,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    scrapeResult = {
      rows,
      failedCourses,
      duplicateCount: countDuplicateOptions(rows),
      totalCoursesAttempted: options.retryOnly.length,
    };
  } else {
    scrapeResult = await scrapeCourseList(
      curriculumSelect,
      courseSelect,
      categories,
      onProgress,
      options.signal,
      startTime,
      options.existingRows ?? [],
      []
    );
  }

  if (scrapeResult.rows.length === 0) {
    throw new Error("NO_DATA");
  }

  const payload = aggregateRows(scrapeResult.rows);

  onProgress(
    makeProgress({
      phase: "complete",
      coursesCollected: payload.courses.length,
      optionsCollected: payload.courses.reduce((s, c) => s + c.options.length, 0),
      failedCount: scrapeResult.failedCourses.length,
      duplicateCount: scrapeResult.duplicateCount,
      courseTotal: scrapeResult.totalCoursesAttempted,
      courseIndex: scrapeResult.totalCoursesAttempted,
    })
  );

  return { result: payload, scrapeMeta: scrapeResult };
}
