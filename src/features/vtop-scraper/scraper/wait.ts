import { getSelectOptionsFingerprint, isPageLoading } from "./dom";

const DEFAULT_TIMEOUT_MS = 45_000;

export class ScrapeCancelledError extends Error {
  constructor() {
    super("Scrape cancelled");
    this.name = "ScrapeCancelledError";
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ScrapeCancelledError();
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ScrapeCancelledError());
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new ScrapeCancelledError());
      },
      { once: true }
    );
  });
}

export async function waitForCondition(
  predicate: () => boolean,
  options: { timeoutMs?: number; pollMs?: number; signal?: AbortSignal } = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollMs = options.pollMs ?? 50;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    throwIfAborted(options.signal);
    if (predicate()) return;
    await wait(pollMs, options.signal);
  }

  throw new Error("Timed out waiting for condition.");
}

export function observeMutations(
  target: Node,
  options: { timeoutMs?: number; signal?: AbortSignal; filter?: () => boolean } = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    throwIfAborted(options.signal);

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      fn();
    };

    const observer = new MutationObserver(() => {
      throwIfAborted(options.signal);
      if (!options.filter || options.filter()) {
        finish(resolve);
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error("Timed out waiting for DOM mutation.")));
    }, timeoutMs);

    options.signal?.addEventListener(
      "abort",
      () => finish(() => reject(new ScrapeCancelledError())),
      { once: true }
    );
  });
}

export async function waitForLoadingToFinish(
  signal?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<void> {
  if (!isPageLoading()) return;

  await waitForCondition(() => !isPageLoading(), { timeoutMs, signal }).catch(() => {
    // Spinner detection is best-effort; continue if not found.
  });
}

export async function waitForCourseListUpdate(
  courseSelect: HTMLSelectElement,
  previousFingerprint: string,
  signal?: AbortSignal
): Promise<void> {
  await waitForCondition(
    () => getSelectOptionsFingerprint(courseSelect) !== previousFingerprint,
    { signal, timeoutMs: DEFAULT_TIMEOUT_MS }
  );
  await waitForLoadingToFinish(signal);
}

export async function waitForAllocationTable(
  previousSignature: string,
  getSignature: () => string,
  signal?: AbortSignal
): Promise<void> {
  await waitForLoadingToFinish(signal);

  if (previousSignature === "") {
    await waitForCondition(() => getSignature().length > 0, { signal, timeoutMs: DEFAULT_TIMEOUT_MS });
    return;
  }

  await waitForCondition(
    () => {
      const sig = getSignature();
      return sig.length > 0 && sig !== previousSignature;
    },
    { signal, timeoutMs: DEFAULT_TIMEOUT_MS }
  );
}

let networkTrackingEnabled = false;
let pendingRequests = 0;
let lastNetworkActivity = 0;

function ensureNetworkTracking(): void {
  if (networkTrackingEnabled) return;
  networkTrackingEnabled = true;

  const markActivity = () => {
    lastNetworkActivity = Date.now();
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    pendingRequests++;
    markActivity();
    try {
      return await originalFetch(...args);
    } finally {
      pendingRequests--;
      markActivity();
    }
  };

  const XHR = window.XMLHttpRequest;
  const open = XHR.prototype.open;
  const send = XHR.prototype.send;

  XHR.prototype.open = function (
    this: XMLHttpRequest,
    ...args: [string, string | URL, ...unknown[]]
  ) {
    (this as XMLHttpRequest & { __ffcsTracked?: boolean }).__ffcsTracked = true;
    return (open as (...inner: unknown[]) => void).apply(this, args);
  };

  XHR.prototype.send = function (...args: Parameters<typeof send>) {
    if ((this as XMLHttpRequest & { __ffcsTracked?: boolean }).__ffcsTracked) {
      pendingRequests++;
      markActivity();
      this.addEventListener(
        "loadend",
        () => {
          pendingRequests--;
          markActivity();
        },
        { once: true }
      );
    }
    return send.apply(this, args);
  };
}

export async function waitForNetworkIdle(
  idleMs = 300,
  signal?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<void> {
  ensureNetworkTracking();
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    throwIfAborted(signal);
    await wait(50, signal);
    if (pendingRequests === 0 && Date.now() - lastNetworkActivity >= idleMs) return;
  }
}
