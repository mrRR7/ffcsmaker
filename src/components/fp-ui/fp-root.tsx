"use client";

import localFont from "next/font/local";
import { cn } from "@/utils/cn";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { FPShell } from "@/components/fp-ui/fp-shell";
import { VtopImportHandler } from "@/features/vtop-scraper/components/VtopImportHandler";
import { TourProvider } from "@/features/tour/TourProvider";
import { TourSpotlight } from "@/features/tour/TourSpotlight";
import { TourCard } from "@/features/tour/TourCard";

const spaceGrotesk = localFont({
  src: [
    { path: "../../../public/fonts/fp/SpaceGrotesk-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../../public/fonts/fp/SpaceGrotesk-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--fp-font-display",
  display: "swap"
});

const ibmPlexSans = localFont({
  src: [
    { path: "../../../public/fonts/fp/IBMPlexSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../../public/fonts/fp/IBMPlexSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../../public/fonts/fp/IBMPlexSans-SemiBold.ttf", weight: "600", style: "normal" }
  ],
  variable: "--fp-font-body",
  display: "swap"
});

const ibmPlexMono = localFont({
  src: [
    { path: "../../../public/fonts/fp/IBMPlexMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../../public/fonts/fp/IBMPlexMono-Medium.ttf", weight: "500", style: "normal" }
  ],
  variable: "--fp-font-mono",
  display: "swap"
});

export function FPRoot({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.uiPreferences.theme);

  // Tailwind `dark:` variants (e.g. SharedTimetableView) key off <html>, not .fp-root.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <div
      className={cn(
        spaceGrotesk.variable,
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        "fp-root",
        theme === "light" && "light",
        "min-h-screen"
      )}
    >
      <MotionConfig reducedMotion="user">
        <TourProvider>
          <FPShell>{children}</FPShell>
          <TourSpotlight />
          <TourCard />
          <VtopImportHandler />
        </TourProvider>
      </MotionConfig>
    </div>
  );
}
