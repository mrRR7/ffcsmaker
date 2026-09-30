import type { Metadata } from "next";
import { HeroWeekGrid } from "@/features/landing/HeroWeekGrid";
import { CampusPicker } from "@/features/landing/CampusPicker";
import { LandingSteps } from "@/features/landing/LandingSteps";
import { FaqList } from "@/features/landing/FaqList";

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

const faqs = [
  {
    q: "What is FFCS?",
    a: "FFCS (Fully Flexible Credit System) is how VIT students register: you pick your courses, the slots they run in, and the faculty who teach them. The hard part is finding a combination with no clashes. That's what this does."
  },
  {
    q: "Which VIT campuses does it work for?",
    a: "Vellore, Chennai and Bhopal, each with its own slot catalog. VIT-AP is in progress."
  },
  {
    q: "Is it free? Do I need to log in?",
    a: "Free, and no login. Your course list and timetables stay in your browser unless you choose to share one."
  },
  {
    q: "Does it register my courses on VTOP?",
    a: "No. Nothing is sent to VTOP. Once you pick a week, copy the slot list and register on VTOP yourself."
  }
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Ultimate FFCS",
  url: "https://ffcsmaker.vercel.app/",
  description:
    "Generates every clash-free FFCS timetable for VIT Vellore, Chennai and Bhopal students and ranks them by your preferences.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: 0, priceCurrency: "INR" }
};

export default function LandingPage() {
  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-fp-border-default px-8 pb-14 pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="max-w-3xl font-fp-display text-[44px] font-bold leading-[1.08] tracking-[-0.015em] text-fp-text-strong">
              Your FFCS timetable, built in about a minute.
            </h1>
            <p className="mt-4 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
              Free, no login, nothing sent to VTOP. Every conflict-free combination of your courses, ranked.
            </p>
            <CampusPicker />
          </div>

          <HeroWeekGrid className="hidden lg:block" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-8 pb-14 pt-12">
        <LandingSteps />
      </section>

      <section className="mx-auto max-w-4xl border-t border-fp-border-default px-8 pb-16 pt-12">
        <h2 className="font-fp-display text-[length:var(--text-h)] font-bold tracking-[-0.01em] text-fp-text-strong">
          FFCS questions
        </h2>
        <FaqList faqs={faqs} />
      </section>
    </div>
  );
}
