"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { navPillSpring, popover, routeSlide } from "@/utils/motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleHelp,
  GalleryVerticalEnd,
  Home,
  Layers3,
  Moon,
  Settings,
  Sun,
  Table2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/useAppStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTour } from "@/features/tour/useTour";
import { CAMPUS_LABELS, type Campus } from "@/engine/types";
import { decodeSharedState } from "@/utils/share";
import { FPButton } from "@/components/fp-ui/button";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPLabel } from "@/components/fp-ui/label";
import { FPCard } from "@/components/fp-ui/card";

// Same concept-to-icon mapping the classic app already uses for its own nav
// (AppShell.tsx's navItems) — one icon vocabulary across both skins.
const navItems = [
  { href: "/new", label: "Home", icon: Home },
  { href: "/new/planner", label: "Plan", icon: CalendarCheck },
  { href: "/new/results", label: "Results", icon: Table2 },
  { href: "/new/compare", label: "Compare", icon: Layers3 },
  { href: "/new/saved", label: "Saved", icon: GalleryVerticalEnd },
  { href: "/new/settings", label: "Settings", icon: Settings }
];

// Longest-prefix step order for directional page transitions — anything
// outside this list (settings/admin/legal) is treated as trailing/forward.
const ROUTE_ORDER = ["/new", "/new/planner", "/new/results", "/new/compare", "/new/saved"];

function routeIndex(pathname: string | null) {
  if (!pathname) return ROUTE_ORDER.length;
  const match = ROUTE_ORDER.filter((p) => pathname === p || pathname.startsWith(`${p}/`)).sort(
    (a, b) => b.length - a.length
  )[0];
  return match ? ROUTE_ORDER.indexOf(match) : ROUTE_ORDER.length;
}

const campusOptions: Array<{ campus: Campus; active: boolean }> = [
  { campus: "chennai", active: true },
  { campus: "vellore", active: true },
  { campus: "bhopal", active: true },
  { campus: "ap", active: false }
];

export function FPShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const importedShareRef = useRef(false);
  const [campusMenuOpen, setCampusMenuOpen] = useState(false);
  const [pendingCampus, setPendingCampus] = useState<Campus | null>(null);

  const theme = useAppStore((state) => state.uiPreferences.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const campus = useAppStore((state) => state.campus);
  const setCampus = useAppStore((state) => state.setCampus);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const applySharedState = useAppStore((state) => state.applySharedState);
  const tour = useTour();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const bypassCampusGate =
    pathname === "/new" ||
    pathname?.startsWith("/new/admin") ||
    pathname === "/new/privacy" ||
    pathname === "/new/terms" ||
    pathname === "/new/disclaimer";

  const activeHref = useMemo(() => {
    const match = navItems
      .filter((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.href ?? "/new";
  }, [pathname]);

  const prevRouteIndexRef = useRef(routeIndex(pathname));
  const direction = useMemo(() => {
    const nextIndex = routeIndex(pathname);
    const dir = nextIndex >= prevRouteIndexRef.current ? 1 : -1;
    prevRouteIndexRef.current = nextIndex;
    return dir;
  }, [pathname]);

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
      toast.error("This shared FFCS Planner URL could not be opened.");
      return;
    }
    applySharedState(sharedState);
    params.delete("share");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
    toast.success("Imported shared planner state.");
  }, [applySharedState]);

  function confirmCampusSwitch() {
    if (!pendingCampus) return;
    setCampus(pendingCampus);
    setPendingCampus(null);
    setCampusMenuOpen(false);
    router.push("/new/planner");
  }

  const mainContent = !hasHydrated ? (
    <div
      className="mx-auto mt-20 h-32 max-w-lg animate-pulse rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface"
    />
  ) : !campus && !bypassCampusGate ? (
    <FPCampusGate onPick={setCampus} />
  ) : (
    children
  );

  return (
    <div className="flex min-h-screen flex-col bg-fp-bg-page text-fp-text-body">
      <header className="sticky top-0 z-40 flex items-center gap-5 border-b border-fp-border-default bg-fp-bg-surface px-6 py-3">
        <Link href="/new" className="select-none font-fp-display text-[length:var(--text-h)] font-bold tracking-[-0.01em] text-fp-text-strong">
          FFCS Planner
        </Link>
        <nav className="fp-text hidden items-center gap-[6px] text-[length:var(--text-small)] lg:flex">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                  active ? "text-fp-text-strong font-medium" : "text-fp-text-dim hover:text-fp-text-body"
                )}
              >
                {active ? (
                  <motion.div
                    layoutId="fp-nav-selected"
                    className="absolute inset-0 rounded-[var(--radius-md)]"
                    style={{ backgroundColor: "var(--surface-selected)", zIndex: -1 }}
                    transition={navPillSpring}
                  />
                ) : null}
                <motion.span className="inline-flex" whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </motion.span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          {campus ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setCampusMenuOpen((v) => !v)}
                className="fp-text inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-fp-border-default px-2.5 py-1.5 text-[length:var(--text-small)] text-fp-text-dim hover:text-fp-text-body"
              >
                {CAMPUS_LABELS[campus]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {campusMenuOpen ? (
                  <motion.div
                    variants={popover}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute right-0 z-50 mt-2 w-56 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-1"
                  >
                    {campusOptions.map((option) => {
                      const isActive = option.campus === campus;
                      return (
                        <button
                          key={option.campus}
                          type="button"
                          disabled={!option.active}
                          onClick={() => {
                            if (isActive) {
                              setCampusMenuOpen(false);
                              return;
                            }
                            setPendingCampus(option.campus);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[length:var(--text-small)]",
                            option.active
                              ? "text-fp-text-body hover:bg-fp-bg-raised"
                              : "cursor-not-allowed text-fp-text-dim opacity-50"
                          )}
                        >
                          <span>
                            {CAMPUS_LABELS[option.campus]}
                            {!option.active ? " (soon)" : ""}
                          </span>
                          {isActive ? <Check className="h-3.5 w-3.5 text-fp-accent" strokeWidth={1.5} /> : null}
                        </button>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
          <FPBadge tone="neutral" pill>
            Fall 2026
          </FPBadge>
          {isMobile === false ? (
            <FPButton
              variant="secondary"
              size="sm"
              aria-label="Replay tour"
              onClick={() => tour.start()}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </FPButton>
          ) : null}
          <FPButton
            variant="secondary"
            size="sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </FPButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={pathname}
            custom={direction}
            variants={routeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {mainContent}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center gap-4 border-t border-fp-border-default bg-fp-bg-surface px-6 py-5">
        <FPLabel>Not affiliated with VIT University</FPLabel>
        <div className="ml-auto flex gap-5 text-[length:var(--text-small)] text-fp-text-dim">
          <Link href="/new/privacy" className="hover:text-fp-text-body">
            Privacy
          </Link>
          <Link href="/new/terms" className="hover:text-fp-text-body">
            Terms
          </Link>
          <Link href="/new/disclaimer" className="hover:text-fp-text-body">
            Disclaimer
          </Link>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#11161a" : "#faf9f5",
            color: theme === "dark" ? "#f2f7f4" : "#0b0e11",
            border: "1px solid var(--border-strong)",
            fontFamily: "var(--font-body)"
          }
        }}
      />

      {pendingCampus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,8,10,0.72)] p-4">
          <FPCard className="w-full max-w-md" padding="lg">
            <h2 className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">
              Switch to {CAMPUS_LABELS[pendingCampus]}?
            </h2>
            <p className="mt-3 text-[length:var(--text-small)] leading-[1.5] text-fp-text-dim">
              This clears your current course list and generated timetables. Saved timetables stay.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <FPButton variant="secondary" size="sm" onClick={() => setPendingCampus(null)}>
                Cancel
              </FPButton>
              <FPButton variant="primary" size="sm" onClick={confirmCampusSwitch}>
                Switch campus
              </FPButton>
            </div>
          </FPCard>
        </div>
      ) : null}
    </div>
  );
}

function FPCampusGate({ onPick }: { onPick: (campus: Campus) => void }) {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-8">
      <div className="w-full max-w-2xl text-center">
        <FPLabel tone="accent" variant="eyebrow">FFCS Planner</FPLabel>
        <h1 className="mt-3 font-fp-display text-[length:var(--text-display)] font-bold tracking-[-0.01em] text-fp-text-strong">
          Which campus are you from?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-dim">
          Choose once to load the right catalog, course data, and timetable slots.
        </p>
        <div data-tour-id="campus-picker" className="mt-8 grid grid-cols-2 gap-4">
          {campusOptions.map((option) => (
            <button
              key={option.campus}
              type="button"
              disabled={!option.active}
              onClick={() => onPick(option.campus)}
              className={cn(
                "rounded-[var(--radius-md)] border p-5 text-left transition-[border-color,background-color,transform] duration-[var(--dur-fast)]",
                option.active
                  ? "border-fp-border-default bg-fp-bg-surface hover:border-fp-border-accent active:scale-[0.98]"
                  : "cursor-not-allowed border-fp-border-default bg-fp-bg-inset opacity-60"
              )}
            >
              <div className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">
                {CAMPUS_LABELS[option.campus]}
              </div>
              <FPLabel tone={option.active ? "accent" : "dim"} className="mt-3.5 inline-flex items-center gap-1">
                {option.active ? (
                  <>
                    Ready <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </>
                ) : (
                  "Not yet"
                )}
              </FPLabel>
            </button>
          ))}
        </div>
        <p className="mt-6 text-[length:var(--text-small)] text-fp-text-dim">You can change this anytime in Settings.</p>
      </div>
    </div>
  );
}
