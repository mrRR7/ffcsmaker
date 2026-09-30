"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { GeneratePayload, WorkerDoneMessage, WorkerMessage } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

// "Find my weeks" navigates to /results at once; /results shows the generating
// screen while `generation.running` is true. The worker lives at module scope so
// it survives the planner unmounting, and reports through the store.
// Hold the screen at least this long so a fast search still reads as a moment
// instead of a flash.
const MIN_HOLD_MS = 1200; // one full --matrix-cycle sweep

let worker: Worker | null = null;
let landTimer: number | null = null;

function stopWorker() {
  worker?.terminate();
  worker = null;
  if (landTimer !== null) {
    window.clearTimeout(landTimer);
    landTimer = null;
  }
}

function summarize(result: WorkerDoneMessage) {
  if (result.schedules.length === 0) {
    // Zero results: /results explains why, so only toast what it can't show.
    if (result.capped) {
      toast.error("Search timed out before finding a clash-free schedule. Try narrowing your constraints.");
    }
    return;
  }
  const groups = useAppStore.getState().generatedShapeGroups;
  const weeks = `${groups.length} ${groups.length === 1 ? "week" : "weeks"}`;
  const options = `${result.schedules.length} professor ${result.schedules.length === 1 ? "option" : "options"}`;
  const summary = `Found ${weeks}, ${options}.`;
  toast.success(
    result.capped ? `${summary} Search was capped after 8s — try narrowing constraints for a full search.` : summary
  );
}

export function useGenerator() {
  const router = useRouter();
  const generation = useAppStore((state) => state.generation);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(() => {
    stopWorker();
    useAppStore.getState().setGeneration({ running: false });
  }, []);

  const generate = useCallback(
    (payload: GeneratePayload) => {
      if (payload.courses.length === 0 || payload.slots.length === 0) {
        toast.error("Add at least one course and one slot first.");
        return;
      }
      if (payload.courses.some((course) => course.options.length === 0)) {
        toast.error("Every course needs at least one professor option.");
        return;
      }

      stopWorker();
      setError(null);
      const { setGeneration, setGeneratedSchedules } = useAppStore.getState();
      setGeneration({ running: true, progress: 0, checked: 0, accepted: 0 });
      router.push("/results");

      const startedAt = performance.now();
      const fail = (message: string) => {
        stopWorker();
        setError(message);
        toast.error(message);
        setGeneration({ running: false });
      };

      const w = new Worker(new URL("../engine/worker.ts", import.meta.url), { type: "module" });
      worker = w;

      w.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const data = event.data;
        if (data.type === "progress") {
          setGeneration({ progress: data.progress, checked: data.checked, accepted: data.accepted });
          return;
        }
        if (data.type === "sample") return;
        if (data.type === "done") {
          w.terminate();
          worker = null;
          setGeneration({ progress: 100, checked: data.checked, accepted: data.schedules.length });
          const land = () => {
            landTimer = null;
            setGeneratedSchedules(data.schedules);
            setGeneration({ running: false });
            summarize(data);
          };
          landTimer = window.setTimeout(land, Math.max(0, MIN_HOLD_MS - (performance.now() - startedAt)));
          return;
        }
        fail(data.message);
      };
      w.onerror = () => fail("The generation worker crashed.");
      w.postMessage(payload);
    },
    [router]
  );

  return {
    generate,
    cancel,
    isGenerating: generation.running,
    progress: generation.progress,
    checked: generation.checked,
    accepted: generation.accepted,
    error
  };
}
