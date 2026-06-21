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
  { id: "Mechatronics and Automation", label: "Mechatronics" },
  { id: "B.A., LL.B. (Hons.)", label: "B.A., LL.B. (Hons.)" },
  { id: "B.B.A., LL.B. (Hons.)", label: "B.B.A., LL.B. (Hons.)" },
  { id: "B.B.A. (Hons.)", label: "B.B.A. (Hons.)" },
  { id: "B.Com. (Hons.)", label: "B.Com. (Hons.)" },
  { id: "B.Sc. Computer Science", label: "B.Sc. CS" },
  { id: "B.Sc. Economics (Hons.)", label: "B.Sc. Economics" },
  { id: "B.Sc. Fashion Design", label: "B.Sc. Fashion Design" },
  { id: "Integrated M.Sc. Applied Psychology", label: "Int. M.Sc. Psychology" },
  { id: "Integrated M.Tech. Computer Science and Engineering (Data Science)", label: "Integrated M.Tech. CSE (DS)" },
  { id: "Integrated M.Tech. Software Engineering", label: "Integrated M.Tech. Software Engineering" },
  { id: "M.Tech. CAD/CAM", label: "M.Tech. CAD/CAM" },
  { id: "M.Tech. Computer Science and Engineering", label: "M.Tech. CSE" },
  { id: "M.Tech. Computer Science and Engineering (Artificial Intelligence and Machine Learning)", label: "M.Tech. CSE (AI&ML)" },
  { id: "M.Tech. Artificial Intelligence and Machine Learning (In Collaboration with LTI MindTree)", label: "M.Tech. AI&ML (LTI)" },
  { id: "M.Tech. Artificial Intelligence and Data Science (In Collaboration with LTI MindTree)", label: "M.Tech. AI&DS (LTI)" },
  { id: "M.Tech. Computer Science and Engineering (Big Data Analytics)", label: "M.Tech. CSE (BDA)" },
  { id: "M.Tech. Electric Mobility", label: "M.Tech. Electric Mobility" },
  { id: "M.Tech. Embedded Systems", label: "M.Tech. Embedded Systems" },
  { id: "M.Tech. Mechatronics", label: "M.Tech. Mechatronics" },
  { id: "M.Tech. Structural Engineering", label: "M.Tech. Structural Eng" },
  { id: "M.Tech. VLSI Design", label: "M.Tech. VLSI" },
  { id: "Master of Business Administration", label: "MBA" },
  { id: "Master of Computer Applications", label: "MCA" },
  { id: "M.Sc. Chemistry", label: "M.Sc. Chemistry" },
  { id: "M.Sc. Data Science", label: "M.Sc. Data Science" },
  { id: "M.Sc. Physics", label: "M.Sc. Physics" },
  { id: "LL.M. Corporate Laws", label: "LL.M. Corporate Laws" },
  { id: "LL.M. Intellectual Property Laws", label: "LL.M. IP Laws" },
  { id: "LL.M. International Law and Development", label: "LL.M. Int. Law" }
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
          Choose once to filter courses relevant to your program.
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
                    {option.id.includes("(")
                      ? option.id.split("(")[1].replace(")", "")
                      : option.id.startsWith("Integrated M.Tech.")
                      ? "Integrated"
                      : "Core"}
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
