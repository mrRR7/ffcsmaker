import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { FPLabel } from "@/components/fp-ui/label";
import { DONATE_QR_SRC } from "@/lib/site";
import { SupportActions } from "./SupportActions";

// Checked at build: dropping the PNG into public/ turns the QR on, no code change.
const showQr = existsSync(join(process.cwd(), "public", DONATE_QR_SRC));

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
      <SupportActions showQr={showQr} />
    </div>
  );
}
