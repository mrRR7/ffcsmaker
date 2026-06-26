/**
 * Bookmarklet entry point — bundled to a self-contained IIFE for drag-to-bookmarks.
 */
import { isCourseRegistrationPage, isVtopDomain, runAutomatedScrape } from "./scraper";
import {
  formatProgressBody,
  removeOverlay,
  showCompleteOverlay,
  showProgressOverlay,
} from "./scraper/overlay";
import { uploadResults } from "./scraper/uploadResults";
import type { FailedCourseEntry, ScrapeProgress, VtopRawRow } from "./scraper/internal";
import type { PlannerImportJSON } from "./types";
import { DEFAULT_PLANNER_URL, VTOP_IMPORT_PARAM } from "./types";

declare global {
  interface Window {
    __ffcsVtopBookmarklet?: boolean;
  }
}

function getPlannerBaseUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("ffcsPlannerUrl");
    if (override) return override.replace(/\/planner\/?$/, "");
  } catch {
    // Ignore malformed query strings.
  }
  return DEFAULT_PLANNER_URL.replace(/\/planner\/?$/, "");
}

function countOptions(result: PlannerImportJSON): number {
  return result.courses.reduce((sum, course) => sum + course.options.length, 0);
}

interface ScrapeSession {
  payload: PlannerImportJSON;
  token: string;
  failedCourses: FailedCourseEntry[];
  totalAttempted: number;
  duplicateCount: number;
  rows: VtopRawRow[];
}

async function finishScrape(
  payload: PlannerImportJSON,
  scrapeMeta: {
    rows: VtopRawRow[];
    failedCourses: FailedCourseEntry[];
    duplicateCount: number;
    totalCoursesAttempted: number;
  },
  plannerBase: string,
  existingToken?: string
): Promise<ScrapeSession> {
  const token = existingToken ?? (await uploadResults(payload, plannerBase));
  return {
    payload,
    token,
    failedCourses: scrapeMeta.failedCourses,
    totalAttempted: scrapeMeta.totalCoursesAttempted,
    duplicateCount: scrapeMeta.duplicateCount,
    rows: scrapeMeta.rows,
  };
}

function showCompletion(session: ScrapeSession, plannerBase: string): void {
  const optionCount = countOptions(session.payload);
  const plannerUrl = new URL("/planner", plannerBase);
  plannerUrl.searchParams.set(VTOP_IMPORT_PARAM, session.token);

  showCompleteOverlay({
    courseCount: session.payload.courses.length,
    optionCount,
    duplicateCount: session.duplicateCount,
    failedCount: session.failedCourses.length,
    totalAttempted: session.totalAttempted,
    onOpenPlanner: () => {
      window.location.href = plannerUrl.toString();
    },
    onRetryFailed:
      session.failedCourses.length > 0
        ? () => {
            removeOverlay();
            void runScrapeFlow(plannerBase, {
              retryOnly: session.failedCourses,
              existingRows: session.rows,
              priorTotalAttempted: session.totalAttempted,
            });
          }
        : undefined,
    onClose: () => {
      removeOverlay();
      window.__ffcsVtopBookmarklet = false;
    },
  });
}

async function runScrapeFlow(
  plannerBase: string,
  options: {
    retryOnly?: FailedCourseEntry[];
    existingRows?: VtopRawRow[];
    priorTotalAttempted?: number;
  } = {}
): Promise<void> {
  const abortController = new AbortController();
  const progress = showProgressOverlay(() => abortController.abort());

  const onProgress = (state: ScrapeProgress) => {
    if (state.phase === "scraping") {
      progress.update(formatProgressBody(state));
    }
    if (state.phase === "uploading") {
      progress.update(`<p class="ffcs-value">Uploading results…</p>`);
    }
  };

  try {
    const { result, scrapeMeta } = await runAutomatedScrape(onProgress, {
      signal: abortController.signal,
      retryOnly: options.retryOnly,
      existingRows: options.existingRows,
    });

    onProgress({ phase: "uploading" } as ScrapeProgress);
    const session = await finishScrape(
      result,
      {
        ...scrapeMeta,
        totalCoursesAttempted:
          options.priorTotalAttempted ?? scrapeMeta.totalCoursesAttempted,
      },
      plannerBase
    );
    progress.remove();
    showCompletion(session, plannerBase);
  } catch (error) {
    progress.remove();

    if (error instanceof Error && error.message === "Scrape cancelled") {
      window.__ffcsVtopBookmarklet = false;
      return;
    }

    if (error instanceof Error && error.message === "NOT_REGISTRATION_PAGE") {
      alert("This bookmark only works on the Course Registration page.");
    } else if (error instanceof Error && error.message === "NO_DATA") {
      alert(
        "No registration data found.\n\nMake sure you are on the Course Registration page with curriculum and course dropdowns visible."
      );
    } else {
      alert("Unable to scrape VTOP registration data. Please try again.");
      console.error("[Ultimate FFCS]", error);
    }

    window.__ffcsVtopBookmarklet = false;
  }
}

export async function runBookmarklet() {
  if (window.__ffcsVtopBookmarklet) return;
  window.__ffcsVtopBookmarklet = true;

  if (!isVtopDomain()) {
    alert("This bookmark only works on the Course Registration page.");
    window.__ffcsVtopBookmarklet = false;
    return;
  }

  if (!isCourseRegistrationPage()) {
    alert("This bookmark only works on the Course Registration page.");
    window.__ffcsVtopBookmarklet = false;
    return;
  }

  const plannerBase = getPlannerBaseUrl();
  await runScrapeFlow(plannerBase);
}

if (typeof window !== "undefined") {
  void runBookmarklet();
}
