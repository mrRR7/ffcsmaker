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
    <div className="pb-20 lg:pb-0 relative">
      {/* Subtle engineering grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-[80vh] w-full bg-engineering-grid [mask-image:linear-gradient(to_bottom,black_10%,transparent_100%)] opacity-[0.25] dark:opacity-[0.12]"></div>
      
      <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <h1 className="mt-6 max-w-3xl font-display text-[48px] sm:text-[64px] font-semibold leading-[1.05] tracking-[-1.5px] sm:tracking-[-2px] text-ink">
            Generate your optimal college schedule
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.5] text-muted">
            Build clash-free timetables locally. Input your courses, define constraints, and let the engine rank hundreds of valid permutations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planner"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
            >
              Open Planner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Card className="rounded-lg border border-hairline bg-canvas shadow-none overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold font-display tracking-tight text-ink">Generated Timetable #1</p>
                <p className="text-[13px] text-muted">Score: 92/100 (Dense config)</p>
              </div>
              <div className="flex gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-card border border-hairline text-muted">
                  <Share2 className="h-3.5 w-3.5" />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-card border border-hairline text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
                <div key={day} className="flex flex-col gap-1.5 min-h-[320px] rounded-md border border-hairline bg-surface-soft p-1.5">
                  <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {day}
                  </p>
                  {index % 2 === 0 ? (
                    <PreviewBlock color="bg-brand-accent" text="A1" time="08:00" />
                  ) : (
                    <div className="h-[46px] border border-dashed border-hairline rounded flex items-center justify-center"><span className="text-[10px] text-muted">Empty</span></div>
                  )}
                  {index % 3 === 0 ? (
                    <PreviewBlock color="bg-badge-violet" text="TA1" time="10:00" />
                  ) : null}
                  {index === 1 || index === 3 ? (
                    <PreviewBlock color="bg-success" text="L1+L2" time="14:00" />
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
  color,
  text,
  time
}: {
  color: string;
  text: string;
  time: string;
}) {
  return (
    <div className={`${color} rounded flex flex-col justify-center p-2 text-white shadow-none h-[46px]`}>
      <span className="text-[12px] font-bold leading-none">{text}</span>
      <span className="text-[9px] opacity-80 mt-1 leading-none font-mono">{time}</span>
    </div>
  );
}
