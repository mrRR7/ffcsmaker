"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { GeneratePayload, WorkerMessage } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";

export function useGenerator() {
  const workerRef = useRef<Worker | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsGenerating(false);
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

      cancel();
      setError(null);
      setProgress(0);
      setChecked(0);
      setAccepted(0);
      setIsGenerating(true);

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

        if (event.data.type === "done") {
          setGeneratedSchedules(event.data.schedules);
          setProgress(100);
          setChecked(event.data.checked);
          setAccepted(event.data.schedules.length);
          setIsGenerating(false);
          worker.terminate();
          workerRef.current = null;
          if (event.data.schedules.length === 0) {
            toast.error("No clash-free schedules matched the hard constraints.");
          } else {
            toast.success(`Generated ${event.data.schedules.length} ranked schedules.`);
          }
          return;
        }

        setError(event.data.message);
        toast.error(event.data.message);
        setIsGenerating(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.onerror = () => {
        const message = "The generation worker crashed.";
        setError(message);
        toast.error(message);
        setIsGenerating(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage(payload);
    },
    [cancel, setGeneratedSchedules]
  );

  return {
    generate,
    cancel,
    isGenerating,
    progress,
    checked,
    accepted,
    error
  };
}
