"use client";

import { useState } from "react";
import { Ban, Clock4, LockKeyhole, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { BlockedWindow, DAYS } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

function commaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ConstraintPanel() {
  const constraints = useAppStore((state) => state.constraints);
  const courses = useAppStore((state) => state.courses);
  const setConstraint = useAppStore((state) => state.setConstraint);
  const addBlockedWindow = useAppStore((state) => state.addBlockedWindow);
  const updateBlockedWindow = useAppStore((state) => state.updateBlockedWindow);
  const deleteBlockedWindow = useAppStore((state) => state.deleteBlockedWindow);
  const resetConstraints = useAppStore((state) => state.resetConstraints);
  const [blockedDraft, setBlockedDraft] = useState<Omit<BlockedWindow, "id">>({
    day: "All",
    startTime: "12:30",
    endTime: "13:30",
    label: "Focus block"
  });

  function submitBlockedWindow() {
    addBlockedWindow(blockedDraft);
    setBlockedDraft({
      day: "All",
      startTime: "12:30",
      endTime: "13:30",
      label: "Focus block"
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-primary" />
            Hard Constraints
          </CardTitle>
          <CardDescription>Invalid schedules are rejected during generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="No classes before">
              <Input
                type="time"
                value={constraints.noBeforeTime ?? ""}
                onChange={(event) =>
                  setConstraint("noBeforeTime", event.target.value || null)
                }
              />
            </Field>
            <Field label="No classes after">
              <Input
                type="time"
                value={constraints.noAfterTime ?? ""}
                onChange={(event) =>
                  setConstraint("noAfterTime", event.target.value || null)
                }
              />
            </Field>
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
            <Field label="Max total gap slots">
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
            <Field label="Avoid professors">
              <Input
                value={constraints.avoidProfessors.join(", ")}
                onChange={(event) =>
                  setConstraint("avoidProfessors", commaList(event.target.value))
                }
                placeholder="Name, Name"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
              onClick={() =>
                setConstraint("avoidLastPeriod", !constraints.avoidLastPeriod)
              }
            />
            <SwitchButton
              active={constraints.protectLunch}
              label="Protect lunch"
              onClick={() => setConstraint("protectLunch", !constraints.protectLunch)}
            />
          </div>

          <div>
            <Label>End before by day</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-20 text-sm text-muted-foreground">{day.slice(0, 3)}</span>
                  <Input
                    type="time"
                    value={constraints.endBeforeByDay[day] ?? ""}
                    onChange={(event) =>
                      setConstraint("endBeforeByDay", {
                        ...constraints.endBeforeByDay,
                        [day]: event.target.value || null
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Professor locks</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {courses.flatMap((course) =>
                course.options.map((option) => {
                  const value = `${course.id}:${option.id}`;
                  const active = constraints.professorLocks.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setConstraint(
                          "professorLocks",
                          constraints.professorLocks.includes(value)
                            ? constraints.professorLocks.filter((lock) => lock !== value)
                            : [...constraints.professorLocks, value]
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LockKeyhole className="h-3.5 w-3.5" />
                      {course.courseCode} - {option.professorName}
                    </button>
                  );
                })
              )}
              {courses.every((course) => course.options.length === 0) ? (
                <p className="text-sm text-muted-foreground">No professor options.</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Soft Preferences
            </CardTitle>
            <CardDescription>Preferences influence ranking after hard pruning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <Field label="Preferred professors">
              <Input
                value={constraints.preferredProfessors.join(", ")}
                onChange={(event) =>
                  setConstraint("preferredProfessors", commaList(event.target.value))
                }
                placeholder="Name, Name"
              />
            </Field>
            <Button type="button" variant="outline" onClick={resetConstraints}>
              Reset Constraints
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock4 className="h-5 w-5 text-primary" />
              Blocked Windows
            </CardTitle>
            <CardDescription>Protect lunch, work, commute, or club time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
      </div>
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
      <Label>{label}</Label>
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
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary/35 text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/40"
        )}
      />
    </button>
  );
}
