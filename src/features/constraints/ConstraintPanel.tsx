"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { Clock4, Plus, Settings2, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { BlockedWindow, Constraints, DAYS } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { ConstraintSectionNav } from "./ConstraintSectionNav";

function getInitialEndBeforeTime(constraints: Constraints) {
  return constraints.endBeforeByDay[DAYS[0]] ?? "16:00";
}

function getInitialEndBeforeDays(constraints: Constraints) {
  return Object.values(constraints.endBeforeByDay).filter(Boolean).length;
}

export function ConstraintPanel() {
  const constraints = useAppStore((state) => state.constraints);
  const setConstraint = useAppStore((state) => state.setConstraint);
  const addBlockedWindow = useAppStore((state) => state.addBlockedWindow);
  const updateBlockedWindow = useAppStore((state) => state.updateBlockedWindow);
  const deleteBlockedWindow = useAppStore((state) => state.deleteBlockedWindow);
  const resetConstraints = useAppStore((state) => state.resetConstraints);

  const [blockedDraft, setBlockedDraft] = useState<Omit<BlockedWindow, "id">>({
    day: "All",
    startTime: "12:30",
    endTime: "13:30",
    label: ""
  });
  const [endBeforeTime, setEndBeforeTime] = useState(() => getInitialEndBeforeTime(constraints));
  const [endBeforeDays, setEndBeforeDays] = useState(() => getInitialEndBeforeDays(constraints));

  function submitBlockedWindow() {
    addBlockedWindow(blockedDraft);
    setBlockedDraft({
      day: "All",
      startTime: "12:30",
      endTime: "13:30",
      label: ""
    });
  }

  function updateEndBeforePreference(nextDays: number, nextTime: string) {
    setEndBeforeDays(nextDays);
    setEndBeforeTime(nextTime);

    const nextMap = DAYS.reduce<Partial<Record<(typeof DAYS)[number], string | null>>>((acc, day, index) => {
      acc[day] = index < nextDays ? nextTime : null;
      return acc;
    }, {});

    setConstraint("endBeforeByDay", nextMap);
  }

  const sections = [
    { id: "time-preferences", label: "Time Preferences", icon: <Settings2 className="h-4 w-4" /> },
    { id: "end-before", label: "Early Finish", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { id: "blocked-windows", label: "Blocked Windows", icon: <Clock4 className="h-4 w-4" /> }
  ];

  return (
    <div className="relative grid items-start gap-8 xl:grid-cols-[220px_1fr]">
      <ConstraintSectionNav sections={sections} />

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8 pb-24">
        <motion.section variants={fadeUp} id="time-preferences" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Time Preferences</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Keep the schedule shaped around the parts of the day you actually want to protect.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Max classes per day">
                  <Input
                    type="number"
                    min={1}
                    value={constraints.maxClassesPerDay ?? ""}
                    onChange={(event) =>
                      setConstraint(
                        "maxClassesPerDay",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                  />
                </Field>
                <Field label="Max gap slots">
                  <Input
                    type="number"
                    min={0}
                    value={constraints.maxGapSlots ?? ""}
                    onChange={(event) =>
                      setConstraint(
                        "maxGapSlots",
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SwitchButton
                  active={constraints.minimizeDays}
                  label="Minimize active days"
                  onClick={() => setConstraint("minimizeDays", !constraints.minimizeDays)}
                />
                <SwitchButton
                  active={constraints.preferCompactness}
                  label="Prefer compactness"
                  onClick={() =>
                    setConstraint("preferCompactness", !constraints.preferCompactness)
                  }
                />
                <SwitchButton
                  active={constraints.preferHalfDays}
                  label="Prefer half days"
                  onClick={() =>
                    setConstraint("preferHalfDays", !constraints.preferHalfDays)
                  }
                />
                <SwitchButton
                  active={constraints.preferEarlyFinish}
                  label="Prefer early finish"
                  onClick={() =>
                    setConstraint("preferEarlyFinish", !constraints.preferEarlyFinish)
                  }
                />
                <SwitchButton
                  active={constraints.avoidFirstPeriod}
                  label="Avoid first period"
                  onClick={() =>
                    setConstraint("avoidFirstPeriod", !constraints.avoidFirstPeriod)
                  }
                />
                <SwitchButton
                  active={constraints.avoidLastPeriod}
                  label="Avoid last period"
                  onClick={() => setConstraint("avoidLastPeriod", !constraints.avoidLastPeriod)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={fadeUp} id="end-before" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Early Finish</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Optional. Pick how many days should end by the same time instead of filling in day-by-day cutoffs.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
                <Field label="Days to apply">
                  <Input
                    type="range"
                    min={0}
                    max={DAYS.length}
                    value={endBeforeDays}
                    onChange={(event) =>
                      updateEndBeforePreference(Number(event.target.value), endBeforeTime)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Apply the cutoff to {endBeforeDays} day{endBeforeDays === 1 ? "" : "s"}.
                  </p>
                </Field>
                <Field label="Cutoff time">
                  <Input
                    type="time"
                    value={endBeforeTime}
                    onChange={(event) =>
                      updateEndBeforePreference(endBeforeDays, event.target.value || "16:00")
                    }
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => updateEndBeforePreference(0, endBeforeTime)}
                  >
                    Clear cutoff
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {DAYS.map((day, index) => {
                  const active = Boolean(constraints.endBeforeByDay[day]);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => updateEndBeforePreference(index + 1, endBeforeTime)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{day.slice(0, 3)}</span>
                      <span>{active ? constraints.endBeforeByDay[day] : "Off"}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={fadeUp} id="blocked-windows" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Blocked Windows</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Protect work, commute, club time, or any recurring block.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_140px_44px]">
                <Input
                  value={blockedDraft.label ?? ""}
                  onChange={(event) =>
                    setBlockedDraft((current) => ({
                      ...current,
                      label: event.target.value
                    }))
                  }
                  placeholder="Label"
                />
                <Select
                  value={blockedDraft.day}
                  onChange={(event) =>
                    setBlockedDraft((current) => ({
                      ...current,
                      day: event.target.value as BlockedWindow["day"]
                    }))
                  }
                >
                  <option value="All">All</option>
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
                <Input
                  type="time"
                  value={blockedDraft.startTime}
                  onChange={(event) =>
                    setBlockedDraft((current) => ({
                      ...current,
                      startTime: event.target.value
                    }))
                  }
                />
                <Input
                  type="time"
                  value={blockedDraft.endTime}
                  onChange={(event) =>
                    setBlockedDraft((current) => ({
                      ...current,
                      endTime: event.target.value
                    }))
                  }
                />
                <Button type="button" size="icon" onClick={submitBlockedWindow}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {constraints.blockedWindows.map((blockedWindow) => (
                  <div
                    key={blockedWindow.id}
                    className="grid gap-2 rounded-md border border-border bg-background/35 p-3 md:grid-cols-[1fr_140px_140px_140px_44px]"
                  >
                    <Input
                      value={blockedWindow.label ?? ""}
                      onChange={(event) =>
                        updateBlockedWindow(blockedWindow.id, {
                          label: event.target.value
                        })
                      }
                    />
                    <Select
                      value={blockedWindow.day}
                      onChange={(event) =>
                        updateBlockedWindow(blockedWindow.id, {
                          day: event.target.value as BlockedWindow["day"]
                        })
                      }
                    >
                      <option value="All">All</option>
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="time"
                      value={blockedWindow.startTime}
                      onChange={(event) =>
                        updateBlockedWindow(blockedWindow.id, {
                          startTime: event.target.value
                        })
                      }
                    />
                    <Input
                      type="time"
                      value={blockedWindow.endTime}
                      onChange={(event) =>
                        updateBlockedWindow(blockedWindow.id, {
                          endTime: event.target.value
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteBlockedWindow(blockedWindow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.div variants={fadeUp} className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={resetConstraints}>
            Reset All Constraints
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SwitchButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-3 text-left text-sm font-medium transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full transition-colors",
          active ? "bg-primary" : "bg-muted-foreground/30"
        )}
      />
    </button>
  );
}
