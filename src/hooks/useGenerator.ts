"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { GeneratePayload, TimetableSelection, WorkerDoneMessage, WorkerMessage } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

// With `playback`, real accepted schedules streamed from the worker are shown
// one at a time before navigating, so the search reads as work being done
// rather than a bar that flashes past. Off by default so other callers still
// navigate the instant the search finishes.
const SAMPLE_INTERVAL_MS = 160;
const MIN_HOLD_MS = 700;

export type GenerationCandidate = { key: number; selections: TimetableSelection[] };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useGenerator({ playback = false }: { playback?: boolean } = {}) {
  const router = useRouter();
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);
  const queueRef = useRef<TimetableSelection[][]>([]);
  const doneRef = useRef<WorkerDoneMessage | null>(null);
  const startedAtRef = useRef(0);
  const keyRef = useRef(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [candidate, setCandidate] = useState<GenerationCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);

  const clearPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    queueRef.current = [];
    doneRef.current = null;
    setCandidate(null);
  }, []);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    // Results are only stored once a search finishes, so a cancel before that
    // must not leave a found-count pointing at results that don't exist.
    const hadResult = doneRef.current !== null;
    clearPlayback();
    if (!hadResult) setAccepted(0);
    setIsGenerating(false);
  }, [clearPlayback]);

  useEffect(() => () => clearPlayback(), [clearPlayback]);

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

      cancel();
      setError(null);
      setProgress(0);
      setChecked(0);
      setAccepted(0);
      setIsGenerating(true);

      const animate = playback && !prefersReducedMotion();

      function finish(result: WorkerDoneMessage) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCandidate(null);
        setIsGenerating(false);
        router.push("/results");
        if (result.schedules.length === 0) {
          toast.error(
            result.capped
              ? "Search timed out before finding a clash-free schedule. Try narrowing your constraints."
              : "No clash-free schedules matched the hard constraints."
          );
        } else {
          const groups = useAppStore.getState().generatedShapeGroups;
          const summary = `Generated ${result.schedules.length} schedules across ${groups.length} unique shapes.`;
          if (result.capped) {
            toast.success(`${summary} Search was capped after 8s — try narrowing constraints for a full search.`);
          } else {
            toast.success(summary);
          }
        }
      }

      // Runs on every playback tick and when the search finishes: release the
      // next sample, and navigate once the search is done, every sample has
      // been shown, and the minimum hold has elapsed.
      function tick() {
        const next = queueRef.current.shift();
        if (next) {
          keyRef.current += 1;
          setCandidate({ key: keyRef.current, selections: next });
          return;
        }
        const result = doneRef.current;
        if (result && performance.now() - startedAtRef.current >= MIN_HOLD_MS) {
          finish(result);
        }
      }

      startedAtRef.current = performance.now();
      if (animate) {
        timerRef.current = window.setInterval(tick, SAMPLE_INTERVAL_MS);
      }

      const worker = new Worker(new URL("../engine/worker.ts", import.meta.url), {
        type: "module"
      });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type === "progress") {
          setProgress(event.data.progress);
          setChecked(event.data.checked);
          setAccepted(event.data.accepted);
          return;
        }

        if (event.data.type === "sample") {
          if (animate) queueRef.current.push(event.data.selections);
          return;
        }

        if (event.data.type === "done") {
          const result = event.data;
          setGeneratedSchedules(result.schedules);
          setProgress(100);
          setChecked(result.checked);
          setAccepted(result.schedules.length);
          worker.terminate();
          workerRef.current = null;

          if (animate && result.schedules.length > 0) {
            doneRef.current = result;
          } else {
            finish(result);
          }
          return;
        }

        setError(event.data.message);
        toast.error(event.data.message);
        clearPlayback();
        setIsGenerating(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.onerror = () => {
        const message = "The generation worker crashed.";
        setError(message);
        toast.error(message);
        clearPlayback();
        setIsGenerating(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage(payload);
    },
    [cancel, clearPlayback, playback, setGeneratedSchedules, router]
  );

  return {
    generate,
    cancel,
    isGenerating,
    progress,
    checked,
    accepted,
    candidate,
    error
  };
}
