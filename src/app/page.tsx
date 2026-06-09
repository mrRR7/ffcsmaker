import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="pb-20 lg:pb-0">
      <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            Frontend-only timetable optimizer
          </Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
            Ultimate FFCS
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Build clash-free college schedules with professor options, lab/theory
            separation, constraint pruning, ranking analytics, local saving, and URL
            sharing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planner"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
            >
              Open Planner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Card className="glass-panel overflow-hidden">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Fixed FFCS slot grid</p>
                <p className="text-xs text-muted-foreground">Theory names and lab pairs</p>
              </div>
              <div className="flex gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Share2 className="h-4 w-4" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
                  <CalendarDays className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
                <div key={day} className="min-h-96 rounded-md border border-white/10 bg-background/40 p-2">
                  <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
                    {day}
                  </p>
                  <PreviewBlock top={index % 2 === 0 ? 12 : 26} color="bg-teal-500" text="A1" />
                  <PreviewBlock top={index % 3 === 0 ? 46 : 58} color="bg-indigo-500" text="TA1" />
                  {index === 1 || index === 3 ? (
                    <PreviewBlock top={72} color="bg-emerald-500" text="L1 + L2" />
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function PreviewBlock({
  top,
  color,
  text
}: {
  top: number;
  color: string;
  text: string;
}) {
  return (
    <div
      className={`${color} relative rounded-md p-2 text-xs font-semibold text-white shadow-lg`}
      style={{ top: `${top}px` }}
    >
      {text}
    </div>
  );
}
