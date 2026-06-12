"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarCheck,
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
import { AppFooter } from "@/components/layout/AppFooter";
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
  const importedShareRef = useRef(false);
  const theme = useAppStore((state) => state.uiPreferences.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const applySharedState = useAppStore((state) => state.applySharedState);

  const activeLabel = useMemo(
    () => navItems.find((item) => item.href === pathname)?.label ?? "Ultimate FFCS",
    [pathname]
  );

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
      </header>
      <main className="mx-auto max-w-7xl flex-1 w-full px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-12">
        <MotionConfig reducedMotion="user">
          {children}
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
    </div>
  );
}
