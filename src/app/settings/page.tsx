"use client";

import { Download, Moon, RotateCcw, Settings2, Sun } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const uiPreferences = useAppStore((state) => state.uiPreferences);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const setTheme = useAppStore((state) => state.setTheme);
  const setCompactMode = useAppStore((state) => state.setCompactMode);
  const setUsePriorityRanking = useAppStore(
    (state) => state.setUsePriorityRanking
  );
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const setExportPreference = useAppStore((state) => state.setExportPreference);
  const resetAll = useAppStore((state) => state.resetAll);

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        eyebrow="Preferences"
        title="Settings"
        description="Theme, ranking defaults, export options, and local data controls."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Interface
            </CardTitle>
            <CardDescription>Visual and workflow defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "rounded-md border p-4 text-left transition",
                  uiPreferences.theme === "dark"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/35"
                )}
              >
                <Moon className="mb-3 h-5 w-5" />
                <span className="font-semibold">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "rounded-md border p-4 text-left transition",
                  uiPreferences.theme === "light"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/35"
                )}
              >
                <Sun className="mb-3 h-5 w-5" />
                <span className="font-semibold">Light</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCompactMode(!uiPreferences.compactMode)}
              className={cn(
                "w-full rounded-md border p-4 text-left transition",
                uiPreferences.compactMode
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/35"
              )}
            >
              <span className="font-semibold">Compact timetable mode</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setUsePriorityRanking(!uiPreferences.usePriorityRanking)
              }
              className={cn(
                "w-full rounded-md border p-4 text-left transition",
                uiPreferences.usePriorityRanking
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/35"
              )}
            >
              <span className="font-semibold">Use priority in ranking</span>
            </button>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Default ranking
              </p>
              <Select
                value={rankingMode}
                onChange={(event) => setRankingMode(event.target.value as RankingMode)}
              >
                {getRankingProfiles().map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Preferences
            </CardTitle>
            <CardDescription>These flags are stored locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreferenceToggle
              label="Include metrics"
              active={uiPreferences.exportPreferences.includeMetrics}
              onClick={() =>
                setExportPreference(
                  "includeMetrics",
                  !uiPreferences.exportPreferences.includeMetrics
                )
              }
            />
            <PreferenceToggle
              label="Include course list"
              active={uiPreferences.exportPreferences.includeCourseList}
              onClick={() =>
                setExportPreference(
                  "includeCourseList",
                  !uiPreferences.exportPreferences.includeCourseList
                )
              }
            />
            <PreferenceToggle
              label="Include score breakdown"
              active={uiPreferences.exportPreferences.includeScoreBreakdown}
              onClick={() =>
                setExportPreference(
                  "includeScoreBreakdown",
                  !uiPreferences.exportPreferences.includeScoreBreakdown
                )
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-destructive" />
              Local Data
            </CardTitle>
            <CardDescription>
              Reset courses, slots, constraints, generated results, saved schedules, and
              preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={resetAll}>
              Reset Ultimate FFCS
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
      />
    </button>
  );
}
