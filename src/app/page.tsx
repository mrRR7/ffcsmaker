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
  },
  {
    q: "I'm a fresher. What do I actually do?",
    a: "Pick your campus, then search each course on your curriculum and tick every professor you'd be fine with. Press Find my weeks, pick a week you like, and save two or three backups. When FFCS opens, register those slots and professors on VTOP."
  },
  {
    q: "What do slots like A1, TA1 and L23 mean?",
    a: "Each letter-number code is a fixed set of periods in the week. A1 is a theory slot, TA1 is the tutorial hour that goes with it, and L-numbers are lab periods, usually booked in pairs like L23 + L24. Two courses clash when they share a slot; the planner never puts clashing courses together."
  },
  {
    q: "Why do some courses have an L and a P version?",
    a: "The L code is the theory part and the P code is the lab. They're registered as separate courses, so add both, and you can pick a different professor for each. Courses that already pair theory and lab under one code are added as one."
  },
  {
    q: "How many professors should I tick?",
    a: "Every one you'd genuinely accept. Each extra professor is another way around a clash, so more ticks means more weeks to choose from. If a course has only one professor ticked, one clash can leave no valid week at all."
  },
  {
    q: "How many credits can I take?",
    a: "VIT's usual maximum is 27 credits a semester. The counter at the top of the planner shows your total and turns red if you go over."
  },
  {
    q: "My course isn't in the search. What now?",
    a: "Switch the planner from Search to another tab. Paste takes course lists copied from WhatsApp forwards or spreadsheets, File imports a CSV or XLSX, and Manual lets you type the course and its slots yourself."
  },
  {
    q: "What if my slot fills up during registration?",
    a: "That's what backups are for. Save a few weeks from Results before FFCS opens; if a seat fills, switch to a saved week that uses a different slot or professor for that course."
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

      <section className="border-b border-fp-border-default px-4 pb-12 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="max-w-3xl font-fp-display text-[34px] font-bold leading-[1.08] sm:text-[44px] tracking-[-0.015em] text-fp-text-strong">
              Your FFCS timetable, built in about a minute.
            </h1>
            <p className="mt-4 max-w-xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
              Free, no login, nothing sent to VTOP. Every conflict-free combination of your courses, ranked.
            </p>
            <CampusPicker />
          </div>

          <HeroWeekGrid className="mx-auto max-w-md lg:max-w-none" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12 pt-10 sm:px-8 sm:pb-14 sm:pt-12">
        <LandingSteps />
      </section>

      <section className="mx-auto max-w-4xl border-t border-fp-border-default px-4 pb-16 pt-10 sm:px-8 sm:pt-12">
        <h2 className="font-fp-display text-[length:var(--text-h)] font-bold tracking-[-0.01em] text-fp-text-strong">
          FFCS questions
        </h2>
        <FaqList faqs={faqs} />
      </section>
    </div>
  );
}
