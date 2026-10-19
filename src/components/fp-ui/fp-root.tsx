"use client";

import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { cn } from "@/utils/cn";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { FPShell } from "@/components/fp-ui/fp-shell";
import { VtopImportHandler } from "@/features/vtop-scraper/components/VtopImportHandler";
import { TourProvider } from "@/features/tour/TourProvider";
import { TourSpotlight } from "@/features/tour/TourSpotlight";
import { TourCard } from "@/features/tour/TourCard";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--fp-font-display",
  display: "swap"
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fp-font-body",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
