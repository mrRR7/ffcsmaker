"use client";

import { useMemo, useState } from "react";
import { DAYS, DayOfWeek, RankingMode } from "@/engine/types";
import { getRankingProfiles } from "@/engine/ranking";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import {
  FPFieldGroup,
  FPNumberFieldRow,
  FPPrefSectionId,
  FPSectionTabs,
  FPToggleRow,
  fpInputClass
} from "./FPPrefControls";
import { FPBlockedWindowsPanel } from "./FPBlockedWindowsPanel";

const SECTIONS: { id: FPPrefSectionId; label: string }[] = [
  { id: "time-preferences", label: "Time Preferences" },
  { id: "time-limits", label: "Time Limits" },
  { id: "early-finish", label: "Early Finish" },
  { id: "blocked-windows", label: "Blocked Windows" }
];

const RANKING_PROFILE_COPY: Record<string, string> = {
  Balanced: "Weighs gaps, end time and free days evenly",
  "Half Days": "Favors days that clear by midday over anything else",
  "Minimize Gaps": "Fewest idle hours between back-to-back classes",
  "Early Finish": "Pushes classes earlier so days end sooner",
  "Late Start": "Pushes classes later, protects the morning"
};

function getInitialEndBeforeTime(endBeforeByDay: Partial<Record<DayOfWeek, string | null>>) {
  return endBeforeByDay[DAYS[0]] ?? "16:00";
}

function getInitialEndBeforeDays(endBeforeByDay: Partial<Record<DayOfWeek, string | null>>) {
  return Object.values(endBeforeByDay).filter(Boolean).length;
}

export function FPPreferencesPane() {
  const constraints = useAppStore((state) => state.constraints);
  const setConstraint = useAppStore((state) => state.setConstraint);
  const resetConstraints = useAppStore((state) => state.resetConstraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const usePriorityRanking = useAppStore((state) => state.uiPreferences.usePriorityRanking);
  const setUsePriorityRanking = useAppStore((state) => state.setUsePriorityRanking);

  const [section, setSection] = useState<FPPrefSectionId>("time-preferences");
  const [endBeforeTime, setEndBeforeTime] = useState(() =>
    getInitialEndBeforeTime(constraints.endBeforeByDay)
  );
  const [endBeforeDays, setEndBeforeDays] = useState(() =>
    getInitialEndBeforeDays(constraints.endBeforeByDay)
  );

  const rankingProfiles = useMemo(() => getRankingProfiles(), []);

  function updateEndBeforePreference(nextDays: number, nextTime: string) {
    setEndBeforeDays(nextDays);
    setEndBeforeTime(nextTime);

    const nextMap = DAYS.reduce<Partial<Record<DayOfWeek, string | null>>>((acc, day, index) => {
      acc[day] = index < nextDays ? nextTime : null;
      return acc;
    }, {});

    setConstraint("endBeforeByDay", nextMap);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px]">
      <section className="min-w-0 px-6 py-7">
        <h2 className="text-[22px]">Anything you&apos;d rather avoid?</h2>
        <p className="mb-5 mt-1.5 text-[13px] text-fp-text-dim">
          All optional. Skip and we&apos;ll show you every week that works.
        </p>

        <FPSectionTabs sections={SECTIONS} active={section} onChange={setSection} />

        {section === "time-preferences" ? (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <FPNumberFieldRow
                snakeLabel="max_classes_per_day"
                description="Cap how many classes land on a single day"
                min={1}
                value={constraints.maxClassesPerDay}
                onChange={(value) => setConstraint("maxClassesPerDay", value)}
              />
              <FPNumberFieldRow
                snakeLabel="max_gap_slots"
                description="Cap idle slots between classes on the same day"
                min={0}
                value={constraints.maxGapSlots}
                onChange={(value) => setConstraint("maxGapSlots", value)}
              />
            </div>

            <FPToggleRow
              checked={constraints.minimizeDays}
              snakeLabel="minimize_days"
              description="Fit classes into as few weekdays as possible"
              onToggle={() => setConstraint("minimizeDays", !constraints.minimizeDays)}
            />
            <FPToggleRow
              checked={constraints.preferCompactness}
              snakeLabel="prefer_compactness"
              description="Favor back-to-back classes over spread-out gaps"
              onToggle={() => setConstraint("preferCompactness", !constraints.preferCompactness)}
            />
            <FPToggleRow
              checked={constraints.preferHalfDays}
              snakeLabel="prefer_half_days"
              description="Favor days that clear out by midday"
              onToggle={() => setConstraint("preferHalfDays", !constraints.preferHalfDays)}
            />
            <FPToggleRow
              checked={constraints.preferEarlyFinish}
              snakeLabel="prefer_early_finish"
              description="Favor schedules that end earlier overall"
              onToggle={() => setConstraint("preferEarlyFinish", !constraints.preferEarlyFinish)}
            />
            <FPToggleRow
              checked={constraints.avoidFirstPeriod}
              snakeLabel="avoid_first_period"
              description="No 08:00 starts"
              onToggle={() => setConstraint("avoidFirstPeriod", !constraints.avoidFirstPeriod)}
            />
            <FPToggleRow
              checked={constraints.avoidLastPeriod}
              snakeLabel="avoid_last_period"
              description="No classes in the last period of the day"
              onToggle={() => setConstraint("avoidLastPeriod", !constraints.avoidLastPeriod)}
            />
          </div>
        ) : null}

        {section === "time-limits" ? (
          <div className="space-y-5">
            <FPNote>
              Global and day-specific hard bounds. Schedules that violate these are rejected outright, not just penalized.
            </FPNote>
            <div className="grid gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-4 sm:grid-cols-2">
              <FPFieldGroup label="earliest_start">
                <input
                  type="time"
                  className={fpInputClass}
                  value={constraints.earliestStart ?? ""}
                  onChange={(event) => setConstraint("earliestStart", event.target.value || null)}
                />
              </FPFieldGroup>
              <FPFieldGroup label="latest_end">
                <input
                  type="time"
                  className={fpInputClass}
                  value={constraints.latestEnd ?? ""}
                  onChange={(event) => setConstraint("latestEnd", event.target.value || null)}
                />
              </FPFieldGroup>
            </div>

            <div>
              <FPLabel className="mb-2 block">Per-day overrides</FPLabel>
              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="grid grid-cols-[92px_1fr_1fr] items-center gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface px-3 py-2.5"
                  >
                    <span className="font-fp-mono text-[12px] text-fp-text-dim">{day.slice(0, 3).toLowerCase()}</span>
                    <input
                      type="time"
                      className={fpInputClass}
                      value={constraints.startAfterByDay[day] ?? ""}
                      onChange={(event) =>
                        setConstraint("startAfterByDay", {
                          ...constraints.startAfterByDay,
                          [day]: event.target.value || null
                        })
                      }
                    />
                    <input
                      type="time"
                      className={fpInputClass}
                      value={constraints.latestEndByDay[day] ?? ""}
                      onChange={(event) =>
                        setConstraint("latestEndByDay", {
                          ...constraints.latestEndByDay,
                          [day]: event.target.value || null
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {section === "early-finish" ? (
          <div className="space-y-5">
            <FPNote>
              Optional. Pick how many days should end by the same cutoff instead of setting each day individually.
            </FPNote>
            <div className="grid gap-4 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-4 lg:grid-cols-[1fr_140px_140px]">
              <FPFieldGroup label={`days_to_apply = ${endBeforeDays}`}>
                <input
                  type="range"
                  min={0}
                  max={DAYS.length}
                  value={endBeforeDays}
                  onChange={(event) => updateEndBeforePreference(Number(event.target.value), endBeforeTime)}
                  style={{ accentColor: "var(--accent)" }}
                  className="w-full"
                />
              </FPFieldGroup>
              <FPFieldGroup label="cutoff_time">
                <input
                  type="time"
                  className={fpInputClass}
                  value={endBeforeTime}
                  onChange={(event) => updateEndBeforePreference(endBeforeDays, event.target.value || "16:00")}
                />
              </FPFieldGroup>
              <div className="flex items-end">
                <FPButton
                  variant="secondary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => updateEndBeforePreference(0, endBeforeTime)}
                >
                  Clear cutoff
                </FPButton>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {DAYS.map((day, index) => {
                const active = Boolean(constraints.endBeforeByDay[day]);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => updateEndBeforePreference(index + 1, endBeforeTime)}
                    className={cn(
                      "fp-label flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-[11px]",
                      active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim"
                    )}
                    style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
                  >
                    <span>{day.slice(0, 3)}</span>
                    <span>{active ? constraints.endBeforeByDay[day] : "Off"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {section === "blocked-windows" ? <FPBlockedWindowsPanel /> : null}
      </section>

      <aside className="min-w-0 border-t border-fp-border-default bg-fp-bg-surface px-6 py-7 lg:border-l lg:border-t-0">
        <FPLabel className="block">Ranking profile</FPLabel>
        <div className="mt-3 grid gap-2">
          {rankingProfiles.map((profile) => {
            const selected = rankingMode === profile;
            return (
              <FPCard
                key={profile}
                selected={selected}
                padding="sm"
                className="cursor-pointer px-4 py-[14px]"
                onClick={() => setRankingMode(profile as RankingMode)}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-fp-display text-[15px] font-bold text-fp-text-strong">{profile}</span>
                  {selected ? <FPLabel tone="accent" className="ml-auto shrink-0">Selected</FPLabel> : null}
                </div>
                <p className="mt-1 text-[12px] text-fp-text-dim">
                  {RANKING_PROFILE_COPY[profile] ?? "Custom scoring weights"}
                </p>
              </FPCard>
            );
          })}
        </div>

        <div className="mt-3">
          <FPToggleRow
            checked={usePriorityRanking}
            snakeLabel="priority_ranking"
            description="Weighs courses and professor options by the order you listed them"
            onToggle={() => setUsePriorityRanking(!usePriorityRanking)}
          />
        </div>

        <div className="mt-7 border-t border-fp-border-default pt-5">
          <FPNote>
            Each added constraint narrows the set of valid weeks. If a run comes back empty, relax the newest one
            first.
          </FPNote>
        </div>

        <div className="mt-6 flex justify-center border-t border-fp-border-default pt-5">
          <FPButton variant="secondary" size="md" onClick={resetConstraints}>
            Reset all constraints
          </FPButton>
        </div>
      </aside>
    </div>
  );
}
