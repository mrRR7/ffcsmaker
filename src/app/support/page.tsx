import type { Metadata } from "next";
import { FPLabel } from "@/components/fp-ui/label";
import { SupportActions } from "./SupportActions";

export const metadata: Metadata = {
  title: "Support",
  description: "Ultimate FFCS is free and built by a student. Donations are optional and help cover hosting.",
  alternates: { canonical: "/support" }
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <header className="space-y-4">
        <FPLabel tone="accent" variant="eyebrow">Support</FPLabel>
        <h1 className="font-fp-display text-[28px] font-bold tracking-[-0.01em] text-fp-text-strong sm:text-[32px]">
          Keep Ultimate FFCS free
        </h1>
        <p className="max-w-2xl text-[14px] leading-[1.6] text-fp-text-dim sm:text-[length:var(--text-body-size)]">
          The planner is free and will stay free. If it saved you time and you&apos;d like to chip in towards
          hosting, any amount is appreciated. Totally optional.
        </p>
      </header>
      <SupportActions />
    </div>
  );
}
