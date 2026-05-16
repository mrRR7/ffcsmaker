import { generateTimetables } from "./generator";
import { GeneratePayload, WorkerMessage } from "./types";

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<GeneratePayload>) => {
  try {
    const result = generateTimetables(event.data, (progress) => {
      ctx.postMessage({
        type: "progress",
        ...progress
      } satisfies WorkerMessage);
    });

    ctx.postMessage({
      type: "done",
      schedules: result.schedules,
      checked: result.checked
    } satisfies WorkerMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Generation failed"
    } satisfies WorkerMessage);
  }
};

export {};
