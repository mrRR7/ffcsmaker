import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  GitCompare,
  Lock,
  Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Local generation",
    text: "Recursive pruning runs inside a browser worker.",
    icon: Lock
  },
  {
    title: "Ranked results",
    text: "Balanced, compact, low-gap, relaxed, and custom profiles.",
    icon: BarChart3
  },
  {
    title: "Visual compare",
    text: "Inspect two or three timetables side by side.",
    icon: GitCompare
  },
  {
    title: "Portable exports",
    text: "PNG, PDF, JSON, and compressed URL sharing.",
    icon: Download
  }
];

const steps = ["Add courses", "Create slots", "Set constraints", "Generate"];

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

      <section className="grid gap-4 md:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardContent className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card/75 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Workflow</p>
            <h2 className="mt-1 text-2xl font-semibold">From course chaos to ranked plans</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-md border border-border bg-background/40 px-4 py-3 text-sm font-semibold"
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </div>
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
