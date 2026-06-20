"use client";

import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { Program } from "@/engine/types";

// Static list of supported programs initially
// In the future this can be derived from the database
export const VALID_PROGRAMS: Array<{
  id: Program;
  label: string;
}> = [
  { id: "Civil Engineering", label: "Civil" },
  { id: "Civil Engineering (In Collaboration with L&T)", label: "Civil (L&T)" },
  { id: "Computer Science and Engineering", label: "CSE Core" },
  { id: "Computer Science and Engineering (Artificial Intelligence and Machine Learning)", label: "CSE (AI&ML)" },
  { id: "Computer Science and Engineering (Artificial Intelligence and Robotics)", label: "CSE (AI&Robotics)" },
  { id: "Computer Science and Engineering (Cyber Physical Systems)", label: "CSE (CPS)" },
  { id: "Computer Science and Engineering (Cyber Security)", label: "CSE (Cyber Sec)" },
  { id: "Computer Science and Engineering (Data Science)", label: "CSE (Data Science)" },
  { id: "Electrical and Computer Science Engineering", label: "ECSE" },
  { id: "Electrical and Electronics Engineering", label: "EEE" },
  { id: "Electronics and Communication Engineering", label: "ECE Core" },
  { id: "Electronics and Computer Engineering", label: "ECM" },
  { id: "Electronics Engineering (VLSI Design and Technology)", label: "ECE (VLSI)" },
  { id: "Fashion Technology", label: "Fashion Tech" },
  { id: "Mechanical Engineering", label: "Mech Core" },
  { id: "Mechanical Engineering (Electric Vehicles)", label: "Mech (EV)" },
  { id: "Mechatronics and Automation", label: "Mechatronics" }
];

export function ProgramSelector() {
  const setProgram = useAppStore((state) => state.setProgram);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8">
      <div className="w-full max-w-4xl text-center">
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Ultimate FFCS Planner
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Which program are you in?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Choose once to filter courses relevant to your B.Tech program.
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {VALID_PROGRAMS.map((option) => (
            <Card
              key={option.id}
              className={cn(
                "relative overflow-hidden border-hairline bg-canvas shadow-none transition",
                "cursor-pointer hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
              )}
            >
              <button
                type="button"
                onClick={() => setProgram(option.id)}
                className="block min-h-24 w-full text-left"
              >
                <CardContent className="flex h-full min-h-24 flex-col justify-center p-4">
                  <span className="block text-sm font-semibold text-foreground sm:text-base">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.id.includes("(") ? option.id.split("(")[1].replace(")", "") : "Core"}
                  </span>
                </CardContent>
              </button>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
