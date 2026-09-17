import Link from "next/link";
import { FPCard } from "@/components/fp-ui/card";
import { FPButton } from "@/components/fp-ui/button";

export default function NewDashboardPage() {
  return (
    <div className="space-y-6 pb-16">
      <FPCard padding="lg">
        <h1 className="font-fp-display text-[var(--text-title)] font-bold text-fp-text-strong">FFCS Planner</h1>
        <p className="mt-1.5 text-[var(--text-small)] text-fp-text-dim">Academic timetable optimizer and planner.</p>
      </FPCard>

      <section className="grid gap-4 md:grid-cols-3">
        <FPCard padding="lg" className="flex flex-col gap-4">
          <div className="font-fp-display text-[var(--text-body-size)] font-bold text-fp-text-strong">Planner</div>
          <Link href="/new/planner">
            <FPButton variant="primary" className="w-full justify-center">
              Open Planner
            </FPButton>
          </Link>
        </FPCard>

        <FPCard padding="lg" className="flex flex-col gap-4">
          <div className="font-fp-display text-[var(--text-body-size)] font-bold text-fp-text-strong">Results</div>
          <Link href="/new/results">
            <FPButton variant="secondary" className="w-full justify-center">
              View Results
            </FPButton>
          </Link>
        </FPCard>

        <FPCard padding="lg" className="flex flex-col gap-4">
          <div className="font-fp-display text-[var(--text-body-size)] font-bold text-fp-text-strong">Saved</div>
          <Link href="/new/saved">
            <FPButton variant="secondary" className="w-full justify-center">
              Open Saved
            </FPButton>
          </Link>
        </FPCard>
      </section>
    </div>
  );
}
