const OVERLAY_ID = "ffcs-vtop-overlay";

const BASE_STYLES = `
  #${OVERLAY_ID} {
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
  #${OVERLAY_ID} * { box-sizing: border-box !important; }
  #${OVERLAY_ID} .ffcs-card {
    width: min(420px, calc(100vw - 32px)) !important;
    border-radius: 16px !important;
    background: #0f172a !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
    padding: 24px !important;
    box-shadow: 0 24px 60px rgba(0,0,0,0.45) !important;
  }
  #${OVERLAY_ID} .ffcs-brand {
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #64748b !important;
    margin: 0 0 4px !important;
  }
  #${OVERLAY_ID} .ffcs-title {
    font-size: 18px !important;
    font-weight: 700 !important;
    margin: 0 0 16px !important;
  }
  #${OVERLAY_ID} .ffcs-section {
    margin: 0 0 14px !important;
  }
  #${OVERLAY_ID} .ffcs-label {
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    color: #64748b !important;
    margin: 0 0 4px !important;
  }
  #${OVERLAY_ID} .ffcs-value {
    font-size: 14px !important;
    color: #e2e8f0 !important;
    margin: 0 !important;
    line-height: 1.4 !important;
  }
  #${OVERLAY_ID} .ffcs-muted {
    font-size: 12px !important;
    color: #94a3b8 !important;
    margin: 2px 0 0 !important;
  }
  #${OVERLAY_ID} .ffcs-stat-row {
    display: flex !important;
    justify-content: space-between !important;
    font-size: 13px !important;
    margin: 0 0 6px !important;
    color: #cbd5e1 !important;
  }
  #${OVERLAY_ID} .ffcs-stat-row strong {
    color: #f8fafc !important;
    font-weight: 600 !important;
  }
  #${OVERLAY_ID} .ffcs-check {
    color: #22c55e !important;
    font-weight: 700 !important;
    margin-right: 8px !important;
  }
  #${OVERLAY_ID} .ffcs-warning {
    color: #fbbf24 !important;
    font-size: 13px !important;
    margin: 12px 0 0 !important;
    line-height: 1.5 !important;
  }
  #${OVERLAY_ID} .ffcs-actions {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    margin-top: 20px !important;
  }
  #${OVERLAY_ID} .ffcs-btn-primary {
    width: 100% !important;
    border: none !important;
    border-radius: 10px !important;
    background: #16a34a !important;
    color: white !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    padding: 12px 16px !important;
    cursor: pointer !important;
  }
  #${OVERLAY_ID} .ffcs-btn-primary:hover { background: #15803d !important; }
  #${OVERLAY_ID} .ffcs-btn-secondary {
    width: 100% !important;
    border: 1px solid #475569 !important;
    border-radius: 10px !important;
    background: transparent !important;
    color: #cbd5e1 !important;
    font-size: 14px !important;
    padding: 12px 14px !important;
    cursor: pointer !important;
  }
  #${OVERLAY_ID} .ffcs-btn-secondary:hover {
    border-color: #64748b !important;
    color: #f8fafc !important;
  }
  #${OVERLAY_ID} .ffcs-btn-cancel {
    width: 100% !important;
    border: 1px solid #475569 !important;
    border-radius: 10px !important;
    background: transparent !important;
    color: #94a3b8 !important;
    font-size: 13px !important;
    padding: 10px 14px !important;
    cursor: pointer !important;
  }
`;

export function removeOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}

function ensureOverlay(): HTMLElement {
  let panel = document.getElementById(OVERLAY_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = OVERLAY_ID;
    document.body.appendChild(panel);
  }
  return panel;
}

export interface ProgressOverlayController {
  update: (html: string) => void;
  remove: () => void;
}

export function showProgressOverlay(onCancel: () => void): ProgressOverlayController {
  removeOverlay();
  const panel = ensureOverlay();

  panel.innerHTML = `
    <style>${BASE_STYLES}</style>
    <div class="ffcs-card" role="dialog" aria-modal="true" aria-live="polite">
      <p class="ffcs-brand">Ultimate FFCS</p>
      <h2 class="ffcs-title">Scraping VTOP…</h2>
      <div id="ffcs-progress-body"></div>
      <div class="ffcs-actions">
        <button type="button" class="ffcs-btn-cancel" id="ffcs-cancel-scrape">Cancel</button>
      </div>
    </div>
  `;

  panel.querySelector("#ffcs-cancel-scrape")?.addEventListener("click", onCancel);

  return {
    update(html: string) {
      const body = panel.querySelector("#ffcs-progress-body");
      if (body) body.innerHTML = html;
    },
    remove: removeOverlay,
  };
}

export function formatProgressBody(data: {
  curriculumLabel: string;
  curriculumIndex: number;
  curriculumTotal: number;
  courseLabel: string;
  courseIndex: number;
  courseTotal: number;
  coursesCollected: number;
  optionsCollected: number;
  estimatedSecondsRemaining: number | null;
}): string {
  const curriculumProgress =
    data.curriculumTotal > 0
      ? `(${data.curriculumIndex} / ${data.curriculumTotal})`
      : "";
  const courseProgress =
    data.courseTotal > 0 ? `(${data.courseIndex} / ${data.courseTotal})` : "";
  const eta =
    data.estimatedSecondsRemaining !== null
      ? `<div class="ffcs-stat-row"><span>Estimated time remaining</span><strong>${data.estimatedSecondsRemaining} seconds</strong></div>`
      : "";

  return `
    <div class="ffcs-section">
      <p class="ffcs-label">Curriculum</p>
      <p class="ffcs-value">${escapeHtml(data.curriculumLabel || "—")}</p>
      <p class="ffcs-muted">${curriculumProgress}</p>
    </div>
    <div class="ffcs-section">
      <p class="ffcs-label">Course</p>
      <p class="ffcs-value">${escapeHtml(data.courseLabel || "—")}</p>
      <p class="ffcs-muted">${courseProgress}</p>
    </div>
    <div class="ffcs-section">
      <p class="ffcs-label">Collected</p>
      <div class="ffcs-stat-row"><span>Courses</span><strong>${data.coursesCollected.toLocaleString()}</strong></div>
      <div class="ffcs-stat-row"><span>Faculty Options</span><strong>${data.optionsCollected.toLocaleString()}</strong></div>
      ${eta}
    </div>
  `;
}

export function showCompleteOverlay(options: {
  courseCount: number;
  optionCount: number;
  duplicateCount: number;
  failedCount: number;
  totalAttempted: number;
  onOpenPlanner: () => void;
  onRetryFailed?: () => void;
  onClose: () => void;
}): void {
  removeOverlay();
  const panel = ensureOverlay();

  const successCount = options.totalAttempted - options.failedCount;
  const duplicateLine =
    options.duplicateCount > 0
      ? `${options.duplicateCount.toLocaleString()} duplicate options merged`
      : "No duplicates found";

  const failureBlock =
    options.failedCount > 0
      ? `
        <p class="ffcs-warning">
          ${successCount.toLocaleString()} / ${options.totalAttempted.toLocaleString()} courses scraped<br>
          ${options.failedCount.toLocaleString()} course${options.failedCount === 1 ? "" : "s"} failed
        </p>
      `
      : "";

  const retryButton =
    options.failedCount > 0 && options.onRetryFailed
      ? `<button type="button" class="ffcs-btn-secondary" id="ffcs-retry-failed">Retry Failed Courses</button>`
      : "";

  panel.innerHTML = `
    <style>${BASE_STYLES}</style>
    <div class="ffcs-card" role="dialog" aria-modal="true">
      <p class="ffcs-brand">Ultimate FFCS</p>
      <h2 class="ffcs-title"><span class="ffcs-check">✓</span>Scraping Complete</h2>
      <div class="ffcs-stat-row"><span>Courses</span><strong>${options.courseCount.toLocaleString()}</strong></div>
      <div class="ffcs-stat-row"><span>Faculty Options</span><strong>${options.optionCount.toLocaleString()}</strong></div>
      <div class="ffcs-stat-row"><span>Deduplication</span><strong>${duplicateLine}</strong></div>
      ${failureBlock}
      <div class="ffcs-actions">
        <button type="button" class="ffcs-btn-primary" id="ffcs-open-planner">Open Ultimate FFCS</button>
        ${retryButton}
        <button type="button" class="ffcs-btn-secondary" id="ffcs-close-overlay">Close</button>
      </div>
    </div>
  `;

  panel.querySelector("#ffcs-open-planner")?.addEventListener("click", options.onOpenPlanner);
  panel.querySelector("#ffcs-retry-failed")?.addEventListener("click", () => {
    options.onRetryFailed?.();
  });
  panel.querySelector("#ffcs-close-overlay")?.addEventListener("click", options.onClose);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
