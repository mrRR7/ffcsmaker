"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import type { VtopCatalogDiff } from "@/lib/vtopImport/compareCatalog";
import type { PlannerImportJSON } from "../types";
import { VTOP_IMPORT_PARAM } from "../types";
import { applyVtopImport, isImportToken, parseVtopPayload } from "../import";

interface PendingVtopImport {
  payload: PlannerImportJSON;
  diff: VtopCatalogDiff;
}

function clearImportParam() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(VTOP_IMPORT_PARAM)) return;
  params.delete(VTOP_IMPORT_PARAM);
  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}

export function usePendingVtopImport() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const [pending, setPending] = useState<PendingVtopImport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);

  const loadToken = useCallback(async (token: string) => {
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/vtop-import/${encodeURIComponent(token)}`);
      const json = (await response.json()) as {
        payload?: PlannerImportJSON;
        diff?: VtopCatalogDiff;
        error?: string;
      };

      if (!response.ok || !json.payload) {
        toast.error(json.error ?? "Unable to import scraped data.");
        clearImportParam();
        return;
      }

      setPending({
        payload: parseVtopPayload(json.payload),
        diff: json.diff ?? {
          newCourses: [],
          newFaculty: [],
          slotChanges: [],
          creditChanges: [],
          stats: {
            courseCount: json.payload.courses.length,
            optionCount: json.payload.courses.reduce(
              (sum, course) => sum + course.options.length,
              0
            ),
            facultyCount: json.payload.faculty.length,
            newCourseCount: 0,
            newFacultyCount: 0,
            slotChangeCount: 0,
            creditChangeCount: 0,
          },
        },
      });
      clearImportParam();
    } catch {
      toast.error("Unable to import scraped data.");
      clearImportParam();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkForToken = useCallback(() => {
    if (!hasHydrated || pending || isLoading) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get(VTOP_IMPORT_PARAM);
    if (!isImportToken(token)) return;

    void loadToken(token);
  }, [hasHydrated, pending, isLoading, loadToken]);

  useEffect(() => {
    checkForToken();
  }, [checkForToken]);

  useEffect(() => {
    if (!hasHydrated) return;

    function onFocus() {
      checkForToken();
    }

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hasHydrated, checkForToken]);

  function dismissPending() {
    setPending(null);
  }

  function confirmImport() {
    if (!pending) return;

    try {
      const result = applyVtopImport(pending.payload);
      toast.success(`Imported ${result.addedCourses} courses from VTOP.`);
      setPending(null);
    } catch {
      toast.error("Unable to import scraped data.");
    }
  }

  return {
    pending,
    isLoading,
    dismissPending,
    confirmImport,
  };
}
