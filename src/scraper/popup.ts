/**
 * FFCS Scraper — Popup Script
 *
 * Communicates with content script on the active VTOP tab
 * and the background service worker for storage.
 */

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function log(message: string) {
  const container = $("#log-entries");
  if (!container) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

async function sendToContent(message: Record<string, unknown>): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");
  return chrome.tabs.sendMessage(tab.id, message);
}

async function refreshStatus() {
  const statusDot = $("#status-dot");
  const statusText = $("#status-text");
  const courseCount = $("#course-count");
  const facultyCount = $("#faculty-count");
  const reqCount = $("#req-count");
  const campusName = $("#campus-name");

  if (!statusDot || !statusText) return;

  try {
    const response = (await sendToContent({ type: "FFCS_SCRAPER_GET_DATA" })) as {
      courses?: number;
      faculty?: number;
      requests?: number;
      campus?: string;
      active?: boolean;
      error?: string;
    } | null;

    if (!response || response.error) {
      statusDot.className = "dot dot-inactive";
      statusText.textContent = "Not on VTOP page";
      if (courseCount) courseCount.textContent = "—";
      if (facultyCount) facultyCount.textContent = "—";
      if (reqCount) reqCount.textContent = "—";
      if (campusName) campusName.textContent = "—";
      return;
    }

    statusDot.className = `dot ${response.active ? "dot-active" : "dot-paused"}`;
    statusText.textContent = response.active ? "Active on VTOP" : "Paused on VTOP";
    if (courseCount) courseCount.textContent = String(response.courses ?? 0);
    if (facultyCount) facultyCount.textContent = String(response.faculty ?? 0);
    if (reqCount) reqCount.textContent = String(response.requests ?? 0);
    if (campusName) campusName.textContent = String(response.campus ?? "—");
  } catch {
    statusDot.className = "dot dot-inactive";
    statusText.textContent = "Not on VTOP page";
  }
}

async function exportData(format: "json" | "csv") {
  try {
    const response = (await sendToContent({
      type: "FFCS_SCRAPER_EXPORT",
      format,
    })) as { data?: string; filename?: string; error?: string };

    if (response?.error) {
      log(`Error: ${response.error}`);
      return;
    }

    if (response?.data) {
      const blob = new Blob(
        [response.data],
        { type: format === "json" ? "application/json" : "text/csv" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.filename ?? `vtop-courses.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log(`Exported ${format.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)`);
    }
  } catch (err) {
    log(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Event Listeners ───────────────────────────────────────────────

$("#refresh-btn")?.addEventListener("click", async () => {
  log("Refreshing...");
  await refreshStatus();
  log("Status updated");
});

$("#export-json-btn")?.addEventListener("click", () => exportData("json"));
$("#export-csv-btn")?.addEventListener("click", () => exportData("csv"));

$("#open-planner-btn")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_PLANNER" });
  log("Opened FFCS Planner");
});

// ─── Init ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  refreshStatus().catch(() => {
    // silently handle — status indicator will show "Not on VTOP"
  });
});
