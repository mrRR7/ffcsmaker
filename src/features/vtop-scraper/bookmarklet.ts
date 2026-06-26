/**
 * Bookmarklet entry point — bundled to a self-contained IIFE for drag-to-bookmarks.
 */
import { isCourseRegistrationPage, isVtopDomain, scrapeVTOP } from "./scraper";
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

function countOptions(result: ReturnType<typeof scrapeVTOP>) {
  return result.courses.reduce((sum, course) => sum + course.options.length, 0);
}

function removeSuccessOverlay() {
  document.getElementById("ffcs-vtop-success")?.remove();
}

function showSuccessOverlay(
  result: ReturnType<typeof scrapeVTOP>,
  token: string,
  plannerBase: string
) {
  removeSuccessOverlay();

  const optionCount = countOptions(result);
  const panel = document.createElement("div");
  panel.id = "ffcs-vtop-success";
  panel.innerHTML = `
    <style>
      #ffcs-vtop-success {
        all: initial;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(15, 23, 42, 0.72) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      #ffcs-vtop-success * { box-sizing: border-box !important; }
      #ffcs-vtop-success .ffcs-card {
        width: min(420px, calc(100vw - 32px)) !important;
        border-radius: 16px !important;
        background: #0f172a !important;
        border: 1px solid #334155 !important;
        color: #f8fafc !important;
        padding: 24px !important;
        box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
      }
      #ffcs-vtop-success .ffcs-title {
        font-size: 18px !important;
        font-weight: 700 !important;
        margin: 0 0 8px !important;
      }
      #ffcs-vtop-success .ffcs-subtitle {
        font-size: 13px !important;
        color: #94a3b8 !important;
        margin: 0 0 20px !important;
        line-height: 1.5 !important;
      }
      #ffcs-vtop-success .ffcs-stat {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        font-size: 14px !important;
        margin: 0 0 10px !important;
      }
      #ffcs-vtop-success .ffcs-check {
        color: #22c55e !important;
        font-weight: 700 !important;
      }
      #ffcs-vtop-success .ffcs-actions {
        display: flex !important;
        gap: 10px !important;
        margin-top: 22px !important;
      }
      #ffcs-vtop-success .ffcs-btn-primary {
        flex: 1 !important;
        border: none !important;
        border-radius: 10px !important;
        background: #16a34a !important;
        color: white !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        padding: 12px 16px !important;
        cursor: pointer !important;
      }
      #ffcs-vtop-success .ffcs-btn-primary:hover { background: #15803d !important; }
      #ffcs-vtop-success .ffcs-btn-secondary {
        border: 1px solid #475569 !important;
        border-radius: 10px !important;
        background: transparent !important;
        color: #cbd5e1 !important;
        font-size: 14px !important;
        padding: 12px 14px !important;
        cursor: pointer !important;
      }
    </style>
    <div class="ffcs-card" role="dialog" aria-modal="true">
      <h2 class="ffcs-title">VTOP data ready</h2>
      <p class="ffcs-subtitle">Your registration data was scraped successfully. Open Ultimate FFCS when you're ready to import.</p>
      <div class="ffcs-stat"><span class="ffcs-check">✓</span><span>Scraped ${result.courses.length} courses</span></div>
      <div class="ffcs-stat"><span class="ffcs-check">✓</span><span>${optionCount.toLocaleString()} faculty options</span></div>
      <div class="ffcs-actions">
        <button type="button" class="ffcs-btn-primary" id="ffcs-open-planner">Open Ultimate FFCS</button>
        <button type="button" class="ffcs-btn-secondary" id="ffcs-close-success">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const plannerUrl = new URL("/planner", plannerBase);
  plannerUrl.searchParams.set(VTOP_IMPORT_PARAM, token);

  panel.querySelector("#ffcs-open-planner")?.addEventListener("click", () => {
    window.location.href = plannerUrl.toString();
  });
  panel.querySelector("#ffcs-close-success")?.addEventListener("click", () => {
    removeSuccessOverlay();
    window.__ffcsVtopBookmarklet = false;
  });
}

async function uploadScrape(result: ReturnType<typeof scrapeVTOP>, plannerBase: string) {
  const apiUrl = new URL("/api/vtop-import", plannerBase).toString();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? "Failed to upload scraped data.");
  }

  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    throw new Error("Import token missing from server response.");
  }

  return json.token;
}

export async function runBookmarklet() {
  if (window.__ffcsVtopBookmarklet) return;
  window.__ffcsVtopBookmarklet = true;

  if (!isVtopDomain()) {
    alert("This bookmark only works on the VTOP Course Registration page.");
    window.__ffcsVtopBookmarklet = false;
    return;
  }

  if (!isCourseRegistrationPage()) {
    alert(
      "This bookmark only works on the VTOP Course Registration page.\n\nNavigate to Course Registration, then try again."
    );
    window.__ffcsVtopBookmarklet = false;
    return;
  }

  try {
    const result = scrapeVTOP();
    if (result.courses.length === 0) {
      alert(
        "No registration data found.\nRefresh the page after your courses have loaded."
      );
      window.__ffcsVtopBookmarklet = false;
      return;
    }

    const plannerBase = getPlannerBaseUrl();
    const token = await uploadScrape(result, plannerBase);
    showSuccessOverlay(result, token, plannerBase);
  } catch {
    alert("Unable to import scraped data.");
    window.__ffcsVtopBookmarklet = false;
  }
}

if (typeof window !== "undefined") {
  void runBookmarklet();
}
