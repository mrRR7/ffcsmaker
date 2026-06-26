"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  GalleryVerticalEnd,
  Home,
  Layers3,
  Moon,
  Settings,
  Sun,
  Table2
} from "lucide-react";
import { MotionConfig } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CampusSelector } from "@/components/CampusSelector";
import { AppFooter } from "@/components/layout/AppFooter";
import { CAMPUS_LABELS, Campus } from "@/engine/types";
import { decodeSharedState } from "@/utils/share";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/useAppStore";
import { mergeCourseOptions, CourseOptionInput } from "@/features/courses/mergeCourseOptions";
import { getSlotCatalog } from "@/engine/slotCatalog";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/planner", label: "Planner", icon: CalendarCheck },
  { href: "/results", label: "Results", icon: Table2 },
  { href: "/compare", label: "Compare", icon: Layers3 },
  { href: "/saved", label: "Saved", icon: GalleryVerticalEnd },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const importedShareRef = useRef(false);
  const [campusMenuOpen, setCampusMenuOpen] = useState(false);
  const [pendingCampus, setPendingCampus] = useState<Campus | null>(null);
  const theme = useAppStore((state) => state.uiPreferences.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const applySharedState = useAppStore((state) => state.applySharedState);
  const campus = useAppStore((state) => state.campus);
  const setCampus = useAppStore((state) => state.setCampus);
  const hasHydrated = useAppStore((state) => state.hasHydrated);


  const activeLabel = useMemo(
    () => navItems.find((item) => item.href === pathname)?.label ?? "Ultimate FFCS",
    [pathname]
  );
  const bypassCampusGate =
    pathname?.startsWith("/admin") ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/disclaimer";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    if (importedShareRef.current) {
      return;
    }
    importedShareRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("share");
    if (!encoded) {
      return;
    }
    const sharedState = decodeSharedState(encoded);
    if (!sharedState) {
      toast.error("This shared Ultimate FFCS URL could not be opened.");
      return;
    }
    applySharedState(sharedState);
    params.delete("share");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
    toast.success("Imported shared planner state.");
  }, [applySharedState]);

  // ── VTOP Scraper Import ──────────────────────────────────────────
  // Handles two delivery paths:
  //   a) BroadcastChannel ("ffcs-vtop-import") — live cross-tab
  //   b) URL param (?vtopImport=) — fallback via new tab
  // Two payload formats:
  //   1. Legacy flat array: [{courseCode, courseName, credits, courseType, faculty, slot}]
  //   2. New nested: {campus, semesterLabel, courses: VtopCourse[], capturedAt}

  const [importedVtop, setImportedVtop] = useState(false);
  const importedVtopRef = useRef(false);

  function processVtopPayload(raw: unknown) {
    if (importedVtopRef.current) return;
    importedVtopRef.current = true;

    let inputs: CourseOptionInput[] = [];

    if (Array.isArray(raw)) {
      // Legacy flat format
      for (const e of raw) {
        if (!e.courseCode || !e.faculty) continue;
        inputs.push({ courseCode: e.courseCode, courseName: e.courseName || e.courseCode, credits: e.credits || 3, professorName: e.faculty, theorySlotsRaw: e.slot || "", labSlotsRaw: "" });
      }
    } else if (raw && typeof raw === "object") {
      const p = raw as Record<string, unknown>;
      const courses = p.courses;
      if (Array.isArray(courses)) {
        for (const c of courses) {
          if (!c || typeof c !== "object") continue;
          const cc = c as Record<string, unknown>;
          const code = String(cc.courseCode ?? "");
          const name = String(cc.courseName ?? code);
          const courseCredits = Number(cc.credits) || 3;
          const options = cc.options;
          if (!code) continue;
          if (Array.isArray(options)) {
            for (const o of options) {
              if (!o || typeof o !== "object") continue;
              const opt = o as Record<string, unknown>;
              const professor = String(opt.professorName ?? "");
              if (!professor) continue;
              const theorySlots = opt.theorySlots;
              const labSlots = opt.labSlots;
              inputs.push({
                courseCode: code,
                courseName: name,
                credits: Number(opt.credits) || courseCredits,
                professorName: professor,
                theorySlotsRaw: Array.isArray(theorySlots) ? theorySlots.join(",") : "",
                labSlotsRaw: Array.isArray(labSlots) ? labSlots.join(",") : "",
              });
            }
          }
        }
      }
    }

    if (inputs.length === 0) {
      toast.error("No course data found in import.");
      return;
    }

    const state = useAppStore.getState();
    const slots = state.slots.length > 0 ? state.slots : getSlotCatalog("standard");
    const result = mergeCourseOptions(state.courses, inputs, slots);
    state.setCourses(result.courses);
    toast.success(`Imported ${result.addedCourses} courses (${result.addedOptions} options) from VTOP.`);
    setImportedVtop(true);
  }

  // BroadcastChannel listener (receives data from VTOP scraper without page reload)
  useEffect(() => {
    if (!hasHydrated) return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("ffcs-vtop-import");
      bc.onmessage = (event) => {
        if (event.data?.type === "FFCS_VTOP_IMPORT" && event.data?.payload) {
          processVtopPayload(event.data.payload);
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }
    return () => { bc?.close(); };
  }, [hasHydrated]);

  // URL param handler (fallback when the planner tab is opened from the scraper)
  useEffect(() => {
    if (importedVtop || importedVtopRef.current || !hasHydrated) return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("vtopImport");
    if (!encoded) return;

    try {
      const json = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(json);
      processVtopPayload(parsed);
      params.delete("vtopImport");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState(null, "", nextUrl);
    } catch (err) {
      toast.error("Could not parse VTOP import data.");
      console.error("vtopImport error:", err);
    }
  }, [hasHydrated, importedVtop]);

  function confirmCampusSwitch() {
    if (!pendingCampus) {
      return;
    }
    setCampus(pendingCampus);
    setPendingCampus(null);
    setCampusMenuOpen(false);
    router.push("/planner");
  }

  const mainContent = !hasHydrated ? (
    <div className="mx-auto mt-20 h-32 max-w-lg animate-pulse rounded-lg border border-hairline bg-surface-card" />
  ) : !campus && !bypassCampusGate ? (
    <CampusSelector />
  ) : (
    children
  );

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center select-none">
            <Image
              src="/logo.png"
              alt="Ultimate FFCS"
              width={240}
              height={32}
              priority
              className="h-7 w-auto sm:h-8"
              style={{ width: "auto" }}
            />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === pathname;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted transition hover:bg-surface-soft hover:text-ink",
                    active && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {campus ? (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCampusMenuOpen((current) => !current)}
                  className="hidden sm:inline-flex"
                >
                  {CAMPUS_LABELS[campus]}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {campusMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-hairline bg-surface-card p-1 shadow-card">
                    {(Object.keys(CAMPUS_LABELS) as Campus[]).map((option) => {
                      const available = option === "chennai" || option === "vellore" || option === "ap" || option === "bhopal";
                      const active = option === campus;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={!available}
                          onClick={() => {
                            if (active) {
                              setCampusMenuOpen(false);
                              return;
                            }
                            setPendingCampus(option);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition",
                            available
                              ? "text-ink hover:bg-surface-soft"
                              : "cursor-not-allowed text-muted-foreground opacity-50"
                          )}
                        >
                          <span>
                            {CAMPUS_LABELS[option]}
                            {!available ? " (coming soon)" : ""}
                          </span>
                          {active ? <Check className="h-4 w-4 text-primary" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Toggle theme"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className={cn(
        "mx-auto max-w-7xl flex-1 w-full",
        pathname === "/planner"
          ? "p-0 md:px-4 md:py-8 md:pb-28 lg:px-8 lg:pb-12"
          : "px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-12"
      )}>
        <MotionConfig reducedMotion="user">
          {mainContent}
        </MotionConfig>
      </main>
      <AppFooter />
      {pathname !== "/planner" ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-2 py-2 backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
            {navItems.slice(1, 7).map((item) => {
              const Icon = item.icon;
              const active = item.href === pathname;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium text-muted transition",
                    active && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#0f172a" : "#ffffff",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
            border: "1px solid rgba(148, 163, 184, 0.25)"
          }
        }}
      />
      {pendingCampus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-5 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">
              Switch to {CAMPUS_LABELS[pendingCampus]}?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This will clear your current course list and generated timetables. Your
              saved timetables will stay.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingCampus(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmCampusSwitch}>
                Switch campus
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
