import { USAGE_EVENTS_ENABLED } from "@/lib/site";
import type { UsageEventName } from "@/lib/usageEvents";
import { useAppStore } from "@/store/useAppStore";

/** Fire-and-forget anonymous event. Never throws, never awaited, never blocks the UI. */
export function track(name: UsageEventName, props?: Record<string, string | number>) {
  if (!USAGE_EVENTS_ENABLED || typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ name, campus: useAppStore.getState().campus, props });
    if (navigator.sendBeacon?.("/api/events", body)) return;
    fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => undefined);
  } catch {
    // Counting is optional; the action already happened.
  }
}
