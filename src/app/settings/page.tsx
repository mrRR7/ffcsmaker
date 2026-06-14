"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Database, Download, MapPin, Moon, RotateCcw, Settings2, Sun } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { CAMPUS_LABELS } from "@/engine/types";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { clearAllCache } from "@/lib/catalogCache";
import { checkStorageCapacity, formatBytes } from "@/lib/storageUtils";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const [confirmCampusReset, setConfirmCampusReset] = useState(false);
  const [storage, setStorage] = useState(checkStorageCapacity());
  const uiPreferences = useAppStore((state) => state.uiPreferences);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const campus = useAppStore((state) => state.campus);
  const generatedAt = useAppStore((state) => state.generatedAt);
  const setTheme = useAppStore((state) => state.setTheme);
  const setCompactMode = useAppStore((state) => state.setCompactMode);
  const setUsePriorityRanking = useAppStore(
    (state) => state.setUsePriorityRanking
  );
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const setExportPreference = useAppStore((state) => state.setExportPreference);
  const resetCampus = useAppStore((state) => state.resetCampus);
  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);
  const resetAll = useAppStore((state) => state.resetAll);

  useEffect(() => {
    setStorage(checkStorageCapacity());
  }, [generatedAt]);

  function clearCatalogCache() {
    clearAllCache();
    toast.success("Course catalog cache cleared.");
  }

  function clearSavedResults() {
    setGeneratedSchedules([]);
    setStorage(checkStorageCapacity());
    toast.success("Generated results cleared.");
  }

  function changeCampus() {
    resetCampus();
    setConfirmCampusReset(false);
    toast.success("Choose your campus again.");
  }

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader title="Settings" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-canvas shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Campus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-background/30 p-4">
              <div>
                <p className="text-sm font-semibold">Current campus</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {campus ? CAMPUS_LABELS[campus] : "Not selected"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmCampusReset(true)}
              >
                Change
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Changing campus clears your current course list and generated timetables.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-canvas shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data & Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CacheRow
              label="Course catalog cache"
              detail="Active, refreshes every 10min"
              action="Clear"
              onClick={clearCatalogCache}
            />
            <CacheRow
              label="Saved results"
              detail={
                generatedAt
                  ? `Last generated: ${new Date(generatedAt).toLocaleString()}`
                  : "No generated results"
              }
              action="Clear"
              onClick={clearSavedResults}
            />
            <div className="rounded-md border border-hairline bg-background/30 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold">Local storage used</span>
                <span className="text-muted-foreground">
                  {formatBytes(storage.usedBytes)} / ~5 MB
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${storage.percentUsed}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-canvas shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition",
                  uiPreferences.theme === "dark"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
                )}
              >
                <Moon className="mb-2 h-4 w-4" />
                <span className="font-semibold text-sm">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition",
                  uiPreferences.theme === "light"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
                )}
              >
                <Sun className="mb-2 h-4 w-4" />
                <span className="font-semibold text-sm">Light</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCompactMode(!uiPreferences.compactMode)}
              className={cn(
                "w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition",
                uiPreferences.compactMode
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
              )}
            >
              <span className="font-semibold text-sm">Compact timetable mode</span>
              <span className={cn("h-2 w-2 rounded-full", uiPreferences.compactMode ? "bg-primary" : "bg-muted-foreground/40")} />
            </button>
            <button
              type="button"
              onClick={() =>
                setUsePriorityRanking(!uiPreferences.usePriorityRanking)
              }
              className={cn(
                "w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition",
                uiPreferences.usePriorityRanking
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
              )}
            >
              <span className="font-semibold text-sm">Use priority in ranking</span>
              <span className={cn("h-2 w-2 rounded-full", uiPreferences.usePriorityRanking ? "bg-primary" : "bg-muted-foreground/40")} />
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

        <Card className="bg-canvas shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Preferences
            </CardTitle>
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

        <Card className="lg:col-span-2 bg-canvas shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-destructive" />
              Local Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={resetAll}>
              Reset Ultimate FFCS
            </Button>
          </CardContent>
        </Card>
      </div>
      {confirmCampusReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-5 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Change campus?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This will clear your current course list and generated timetables. Your
              saved timetables will stay.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmCampusReset(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={changeCampus}>
                Change campus
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CacheRow({
  label,
  detail,
  action,
  onClick
}: {
  label: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-background/30 p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClick}>
        {action}
      </Button>
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
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
      )}
    >
      {label}
      <span
        className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
      />
    </button>
  );
}
