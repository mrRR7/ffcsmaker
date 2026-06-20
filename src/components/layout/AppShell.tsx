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
import { ProgramSelector, VALID_PROGRAMS } from "@/components/ProgramSelector";
import { AppFooter } from "@/components/layout/AppFooter";
import { CAMPUS_LABELS, Campus, Program } from "@/engine/types";
import { decodeSharedState } from "@/utils/share";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/useAppStore";

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
  const program = useAppStore((state) => state.program);
  const setProgram = useAppStore((state) => state.setProgram);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  const [programMenuOpen, setProgramMenuOpen] = useState(false);
  const [pendingProgram, setPendingProgram] = useState<Program | null>(null);

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

  function confirmCampusSwitch() {
    if (!pendingCampus) {
      return;
    }
    setCampus(pendingCampus);
    setPendingCampus(null);
    setCampusMenuOpen(false);
    router.push("/planner");
  }

  function confirmProgramSwitch() {
    if (!pendingProgram) {
      return;
    }
    setProgram(pendingProgram);
    setPendingProgram(null);
    setProgramMenuOpen(false);
    router.push("/planner");
  }

  const mainContent = !hasHydrated ? (
    <div className="mx-auto mt-20 h-32 max-w-lg animate-pulse rounded-lg border border-hairline bg-surface-card" />
  ) : !campus && !bypassCampusGate ? (
    <CampusSelector />
  ) : !program && !bypassCampusGate ? (
    <ProgramSelector />
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
            {program ? (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProgramMenuOpen((current) => !current)}
                  className="hidden sm:inline-flex"
                >
                  {VALID_PROGRAMS.find(p => p.id === program)?.label ?? "Program"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {programMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-56 max-h-96 overflow-y-auto rounded-md border border-hairline bg-surface-card p-1 shadow-card">
                    {VALID_PROGRAMS.map((option) => {
                      const active = option.id === program;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setProgramMenuOpen(false);
                              return;
                            }
                            setPendingProgram(option.id);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition",
                            "text-ink hover:bg-surface-soft"
                          )}
                        >
                          <span>{option.label}</span>
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
      <main className="mx-auto max-w-7xl flex-1 w-full px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-12">
        <MotionConfig reducedMotion="user">
          {mainContent}
        </MotionConfig>
      </main>
      <AppFooter />
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
      {pendingProgram ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-5 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">
              Switch to {VALID_PROGRAMS.find(p => p.id === pendingProgram)?.label}?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This will clear your current course list and generated timetables. Your
              saved timetables will stay.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingProgram(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmProgramSwitch}>
                Switch program
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
