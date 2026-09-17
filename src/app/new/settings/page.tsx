"use client";

import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { CAMPUS_LABELS } from "@/engine/types";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { clearAllCache } from "@/lib/catalogCache";
import { checkStorageCapacity, formatBytes } from "@/lib/storageUtils";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPPanel } from "@/components/fp-ui/panel";
import { FPLabel } from "@/components/fp-ui/label";
import { FPCheckbox } from "@/components/fp-ui/checkbox";
import { FPNote } from "@/components/fp-ui/note";

export default function NewSettingsPage() {
  const [confirmCampusReset, setConfirmCampusReset] = useState(false);
  const [storage, setStorage] = useState(checkStorageCapacity());

  const uiPreferences = useAppStore((state) => state.uiPreferences);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const campus = useAppStore((state) => state.campus);
  const generatedAt = useAppStore((state) => state.generatedAt);
  const setTheme = useAppStore((state) => state.setTheme);
  const setCompactMode = useAppStore((state) => state.setCompactMode);
  const setUsePriorityRanking = useAppStore((state) => state.setUsePriorityRanking);
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const setExportPreference = useAppStore((state) => state.setExportPreference);
  const resetCampus = useAppStore((state) => state.resetCampus);
  const setGeneratedSchedules = useAppStore((state) => state.setGeneratedSchedules);
  const resetAll = useAppStore((state) => state.resetAll);

  useEffect(() => {
    setStorage(checkStorageCapacity());
  }, [generatedAt]);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    setBannerDismissed(localStorage.getItem("dismissed_preliminary_notice") === "true");
  }, []);

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

  function toggleBanner() {
    if (bannerDismissed) {
      localStorage.removeItem("dismissed_preliminary_notice");
      setBannerDismissed(false);
      toast.success("Notice banner will be shown on Planner.");
    } else {
      localStorage.setItem("dismissed_preliminary_notice", "true");
      setBannerDismissed(true);
      toast.success("Notice banner has been hidden.");
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <FPLabel tone="accent" variant="eyebrow">Preferences</FPLabel>
        <h1 className="mt-2 font-fp-display text-[28px] font-bold text-fp-text-strong">Settings</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FPPanel title="CAMPUS" className="lg:col-span-2">
          <div className="space-y-4 p-4">
            <Row
              label="Current campus"
              detail={campus ? CAMPUS_LABELS[campus] : "Not selected"}
              action="Change"
              onClick={() => setConfirmCampusReset(true)}
            />
            <FPNote>
              Changing campus clears your current course list and generated timetables.
            </FPNote>
          </div>
        </FPPanel>

        <FPPanel title="DATA & CACHE">
          <div className="space-y-4 p-4">
            <Row
              label="Course catalog cache"
              detail="Active, refreshes every 10min"
              action="Clear"
              onClick={clearCatalogCache}
            />
            <Row
              label="Saved results"
              detail={
                generatedAt
                  ? `Last generated: ${new Date(generatedAt).toLocaleString()}`
                  : "No generated results"
              }
              action="Clear"
              onClick={clearSavedResults}
            />
            <Row
              label="Preliminary announcement banner"
              detail={bannerDismissed ? "Hidden on Planner page" : "Visible on Planner page"}
              action={bannerDismissed ? "Show" : "Hide"}
              onClick={toggleBanner}
            />
            <div className="rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset p-4">
              <div className="flex items-center justify-between gap-4 text-[var(--text-small)]">
                <span className="text-fp-text-body">Local storage used</span>
                <span className="font-fp-mono text-fp-text-dim">
                  {formatBytes(storage.usedBytes)} / ~5 MB
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-fp-bg-page">
                <div
                  className="h-full rounded-[var(--radius-pill)] bg-fp-accent transition-[width] duration-[var(--dur-base)]"
                  style={{ width: `${storage.percentUsed}%` }}
                />
              </div>
            </div>
          </div>
        </FPPanel>

        <FPPanel title="APPEARANCE">
          <div className="space-y-5 p-4">
            <div className="grid grid-cols-2 gap-3">
              <ThemeOption
                active={uiPreferences.theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-4 w-4" />}
                label="Dark"
              />
              <ThemeOption
                active={uiPreferences.theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="h-4 w-4" />}
                label="Light"
              />
            </div>

            <CheckRow
              checked={uiPreferences.compactMode}
              onToggle={() => setCompactMode(!uiPreferences.compactMode)}
              label="Compact timetable mode"
            />
            <CheckRow
              checked={uiPreferences.usePriorityRanking}
              onToggle={() => setUsePriorityRanking(!uiPreferences.usePriorityRanking)}
              label="Use priority in ranking"
            />

            <div className="space-y-2.5">
              <FPLabel>Default ranking</FPLabel>
              <div className="flex flex-wrap gap-2">
                {getRankingProfiles().map((profile) => (
                  <RankingOption
                    key={profile}
                    active={rankingMode === profile}
                    onClick={() => setRankingMode(profile as RankingMode)}
                    label={profile}
                  />
                ))}
              </div>
            </div>
          </div>
        </FPPanel>

        <FPPanel title="EXPORT">
          <div className="space-y-3 p-4">
            <CheckRow
              checked={uiPreferences.exportPreferences.includeMetrics}
              onToggle={() =>
                setExportPreference(
                  "includeMetrics",
                  !uiPreferences.exportPreferences.includeMetrics
                )
              }
              label="Include metrics"
            />
            <CheckRow
              checked={uiPreferences.exportPreferences.includeCourseList}
              onToggle={() =>
                setExportPreference(
                  "includeCourseList",
                  !uiPreferences.exportPreferences.includeCourseList
                )
              }
              label="Include course list"
            />
            <CheckRow
              checked={uiPreferences.exportPreferences.includeScoreBreakdown}
              onToggle={() =>
                setExportPreference(
                  "includeScoreBreakdown",
                  !uiPreferences.exportPreferences.includeScoreBreakdown
                )
              }
              label="Include score breakdown"
            />
          </div>
        </FPPanel>

        <FPPanel title="LOCAL DATA" className="lg:col-span-2">
          <div className="p-4">
            <FPButton
              variant="secondary"
              onClick={resetAll}
              className="border-fp-danger text-fp-danger hover:border-fp-danger hover:bg-transparent hover:text-fp-danger"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Ultimate FFCS
            </FPButton>
          </div>
        </FPPanel>
      </div>

      {confirmCampusReset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--overlay-scrim)" }}
        >
          <FPCard className="w-full max-w-md" padding="lg">
            <h2 className="font-fp-display text-[var(--text-h)] font-bold text-fp-text-strong">
              Change campus?
            </h2>
            <p className="mt-3 text-[var(--text-small)] leading-[1.5] text-fp-text-dim">
              This will clear your current course list and generated timetables. Your saved
              timetables will stay.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <FPButton variant="secondary" size="sm" onClick={() => setConfirmCampusReset(false)}>
                Cancel
              </FPButton>
              <FPButton variant="primary" size="sm" onClick={changeCampus}>
                Change campus
              </FPButton>
            </div>
          </FPCard>
        </div>
      ) : null}
    </div>
  );
}

function Row({
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
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset p-4">
      <div>
        <p className="text-[var(--text-small)] font-medium text-fp-text-body">{label}</p>
        <p className="mt-1 text-[12px] text-fp-text-dim">{detail}</p>
      </div>
      <FPButton type="button" variant="secondary" size="sm" onClick={onClick}>
        {action}
      </FPButton>
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  label
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <FPCheckbox checked={checked} onCheckedChange={onToggle} />
      <button
        type="button"
        onClick={onToggle}
        className="text-left text-[var(--text-small)] text-fp-text-body"
      >
        {label}
      </button>
    </div>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors",
        active
          ? "border-fp-border-accent text-fp-accent"
          : "border-fp-border-default text-fp-text-dim hover:border-fp-border-strong hover:text-fp-text-body"
      )}
      style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
    >
      <span className="mb-2 block">{icon}</span>
      <span className="fp-label text-[var(--text-micro)]">{label}</span>
    </button>
  );
}

function RankingOption({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fp-label rounded-[var(--radius-sm)] border px-3 py-[7px] text-[var(--text-micro)] transition-colors",
        active
          ? "border-fp-border-accent text-fp-accent"
          : "border-fp-border-default text-fp-text-dim hover:border-fp-border-strong hover:text-fp-text-body"
      )}
      style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
    >
      {label}
    </button>
  );
}
