const TOUR_STORAGE_KEY = "ffcs_tour_completed";

export function hasSeenTour(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
}

export function markTourSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_STORAGE_KEY, "true");
}

export function resetTourSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
