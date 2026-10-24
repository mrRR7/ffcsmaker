import { USAGE_EVENTS_ENABLED } from "@/lib/site";
import type { UsageEventName } from "@/lib/usageEvents";
import { useAppStore } from "@/store/useAppStore";

// Events are queued and sent in batches (every 15s, at 20 events, or when the
// page is hidden or closed) so one session costs a few requests, not one per event.
const FLUSH_AFTER_MS = 15_000;
const FLUSH_AT = 20;

type QueuedEvent = { name: UsageEventName; campus: string | null; props?: Record<string, string | number> };

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (queue.length === 0) return;
  const events = queue;
  queue = [];
  try {
    const body = JSON.stringify({ events });
    if (navigator.sendBeacon?.("/api/events", body)) return;
    fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => undefined);
  } catch {
    // Counting is optional; a lost batch is dropped.
  }
}

/** Fire-and-forget anonymous event. Never throws, never awaited, never blocks the UI. */
export function track(name: UsageEventName, props?: Record<string, string | number>) {
  if (!USAGE_EVENTS_ENABLED || typeof window === "undefined") return;
  try {
    if (!listening) {
      listening = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
      });
      window.addEventListener("pagehide", flush);
    }
    queue.push({ name, campus: useAppStore.getState().campus, props });
    if (queue.length >= FLUSH_AT) flush();
    else timer ??= setTimeout(flush, FLUSH_AFTER_MS);
  } catch {
    // Counting is optional; the action already happened.
  }
}
