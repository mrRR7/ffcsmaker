"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { DayOfWeek, DAYS } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";

export function SlotBuilder() {
  const slots = useAppStore((state) => state.slots);
  const addSlot = useAppStore((state) => state.addSlot);
  const updateSlot = useAppStore((state) => state.updateSlot);
  const deleteSlot = useAppStore((state) => state.deleteSlot);
  const clearSlots = useAppStore((state) => state.clearSlots);
  const applySlotPreset = useAppStore((state) => state.applySlotPreset);
  const importSlotsFromCsv = useAppStore((state) => state.importSlotsFromCsv);
  const [label, setLabel] = useState("");
  const [day, setDay] = useState<DayOfWeek>("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [csv, setCsv] = useState("");

  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a, b) => {
        const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        return dayDiff || a.startTime.localeCompare(b.startTime);
      }),
    [slots]
  );

  function submitSlot() {
    if (!label.trim()) {
      toast.error("Slot label is required.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }
    addSlot({
      label: label.trim(),
      day,
      startTime,
      endTime
    });
    setLabel("");
  }

  function importCsv() {
    const count = importSlotsFromCsv(csv);
    if (count === 0) {
      toast.error("No valid CSV rows found.");
      return;
    }
    setCsv("");
    toast.success(`Imported ${count} slots.`);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Slot Builder</CardTitle>
            <CardDescription>
              Create custom day/time slots or apply a preset template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="A1"
                />
              </div>
              <div className="space-y-2">
                <Label>Day</Label>
                <Select
                  value={day}
                  onChange={(event) => setDay(event.target.value as DayOfWeek)}
                >
                  {DAYS.map((dayOption) => (
                    <option key={dayOption} value={dayOption}>
                      {dayOption}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
            <Button type="button" className="w-full" onClick={submitSlot}>
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <CardDescription>Quickly replace the slot grid.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => applySlotPreset("mon-fri-hourly")}
            >

              Mon-Fri Hourly
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => applySlotPreset("mon-sat-hourly")}
            >
              Mon-Sat Hourly
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => applySlotPreset("studio-grid")}
            >

              Classroom Grid
            </Button>
            <Button type="button" variant="destructive" onClick={clearSlots}>
              <Trash2 className="h-4 w-4" />
              Clear Slots
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Import</CardTitle>
            <CardDescription>Rows: label, day, start, end</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              placeholder="A1,Monday,09:00,10:00"
            />
            <Button type="button" variant="outline" onClick={importCsv}>
              <FileSpreadsheet className="h-4 w-4" />
              Import CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Slot Grid</CardTitle>
              <CardDescription>{slots.length} total custom slots</CardDescription>
            </div>
            <Badge>{DAYS.filter((dayItem) => slots.some((slot) => slot.day === dayItem)).length} active days</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedSlots.map((slot) => (
              <div
                key={slot.id}
                className="grid gap-3 rounded-md border border-border bg-background/35 p-3 md:grid-cols-[1fr_150px_130px_130px_44px]"
              >
                <Input
                  value={slot.label}
                  onChange={(event) => updateSlot(slot.id, { label: event.target.value })}
                />
                <Select
                  value={slot.day}
                  onChange={(event) =>
                    updateSlot(slot.id, { day: event.target.value as DayOfWeek })
                  }
                >
                  {DAYS.map((dayOption) => (
                    <option key={dayOption} value={dayOption}>
                      {dayOption}
                    </option>
                  ))}
                </Select>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(event) =>
                    updateSlot(slot.id, { startTime: event.target.value })
                  }
                />
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(event) => updateSlot(slot.id, { endTime: event.target.value })}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  title="Delete slot"
                  onClick={() => deleteSlot(slot.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {sortedSlots.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-border text-center text-muted-foreground">
                <Clock3 className="mb-3 h-8 w-8" />
                No slots yet.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
