export const STORAGE_KEY = "unitime-pro-state";

const STORAGE_WARNING_THRESHOLD = 3_500_000;
const ASSUMED_STORAGE_LIMIT = 5_000_000;

export function checkStorageCapacity() {
  if (typeof window === "undefined") {
    return { usedBytes: 0, isNearLimit: false, percentUsed: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    const usedBytes = new Blob([stored]).size;
    const percentUsed = Math.min(
      100,
      Math.round((usedBytes / ASSUMED_STORAGE_LIMIT) * 100)
    );
    return {
      usedBytes,
      isNearLimit: usedBytes > STORAGE_WARNING_THRESHOLD,
      percentUsed
    };
  } catch {
    return { usedBytes: 0, isNearLimit: false, percentUsed: 0 };
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
