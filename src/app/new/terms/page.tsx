import type { ReactNode } from "react";
import { FPLabel } from "@/components/fp-ui/label";

export default function NewTermsPage() {
  return (
    <FPLegalPage
      title="Terms of Service"
      description="Welcome to Ultimate FFCS Planner. By using this application, you agree to the following Terms of Service."
    >
      <FPLegalSection title="Purpose">
        <p>
          Ultimate FFCS Planner is an independent timetable planning and schedule
          optimization tool created for educational, personal, and productivity purposes.
        </p>
        <p>The application helps students:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>organize courses</li>
          <li>compare professor combinations</li>
          <li>visualize slot structures</li>
          <li>generate optimized timetables</li>
          <li>manage scheduling constraints</li>
        </ul>
        <p>
          This project is unofficial and is not affiliated with or endorsed by any
          university or institution.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Data Handling">
        <p>
          The application does not intentionally collect, store, or transmit personal
          academic information to external servers.
        </p>
        <p>
          Planner data remains locally stored within your browser unless explicitly
          exported or shared by the user.
        </p>
        <p>Users are solely responsible for:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>imported data</li>
          <li>exported schedules</li>
          <li>shared timetable files</li>
          <li>academic verification</li>
        </ul>
      </FPLegalSection>

      <FPLegalSection title="No Guarantees">
        <p>The application is provided on an &ldquo;as-is&rdquo; basis without guarantees of:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>timetable accuracy</li>
          <li>slot correctness</li>
          <li>uninterrupted availability</li>
          <li>compatibility with institutional systems</li>
          <li>registration success</li>
        </ul>
        <p>
          Generated schedules are advisory tools only and should not be treated as
          official academic records.
        </p>
        <p>Users must independently verify all:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>slot timings</li>
          <li>professor allocations</li>
          <li>course availability</li>
          <li>registration details</li>
        </ul>
        <p>through official university platforms.</p>
      </FPLegalSection>

      <FPLegalSection title="Limitation of Liability">
        <p>The developer shall not be held responsible for:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>timetable conflicts</li>
          <li>inaccurate course data</li>
          <li>registration failures</li>
          <li>lost planner data</li>
          <li>export issues</li>
          <li>scheduling decisions</li>
          <li>academic consequences arising from use of the application</li>
        </ul>
        <p>
          Use of the application is entirely at the user&apos;s own discretion and
          responsibility.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Open Source & Contributions">
        <p>Ultimate FFCS Planner is an open-source project.</p>
        <p>Users may:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>view the source code</li>
          <li>contribute improvements</li>
          <li>fork the project</li>
          <li>suggest modifications</li>
        </ul>
        <p>subject to the project&apos;s applicable open-source license.</p>
        <p>
          GitHub Repository:
          <br />
          <a
            href="https://github.com/mrRR7/ffcsmaker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fp-text-strong underline-offset-4 transition hover:underline"
          >
            https://github.com/mrRR7/ffcsmaker
          </a>
        </p>
      </FPLegalSection>

      <FPLegalSection title="Acceptable Use">
        <p>Users agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>abuse the application infrastructure</li>
          <li>attempt malicious modification of the platform</li>
          <li>exploit vulnerabilities intentionally</li>
          <li>use the application for unlawful purposes</li>
        </ul>
      </FPLegalSection>

      <FPLegalSection title="Changes to Terms">
        <p>These Terms of Service may be updated periodically to reflect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>application improvements</li>
          <li>feature additions</li>
          <li>policy refinements</li>
          <li>infrastructure changes</li>
        </ul>
        <p>
          Continued use of the application after updates constitutes acceptance of the
          revised terms.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Contact">
        <p>
          For questions, feedback, or concerns regarding these Terms of Service, contact:
        </p>
        <p>mr_RR7</p>
        <p>
          Email:
          <br />
          <a
            href="mailto:rakeshrajanikanth@gmail.com"
            className="text-fp-text-strong underline-offset-4 transition hover:underline"
          >
            rakeshrajanikanth@gmail.com
          </a>
        </p>
        <p>
          GitHub:
          <br />
          <a
            href="https://github.com/mrRR7/ffcsmaker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fp-text-strong underline-offset-4 transition hover:underline"
          >
            https://github.com/mrRR7/ffcsmaker
          </a>
        </p>
      </FPLegalSection>
    </FPLegalPage>
  );
}

/**
 * Co-located legal-page shell for the FFCS Planner skin. Restyles the classic
 * app's LegalLayout/LegalHeader (Space Grotesk heading, IBM Plex Sans body,
 * hairline divider) while reusing the classic pages' text content verbatim.
 * Duplicated identically in ../privacy/page.tsx since each legal page lives
 * in its own allowed directory.
 */
function FPLegalPage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <header className="space-y-4">
        <FPLabel tone="accent">Legal</FPLabel>
        <h1 className="font-fp-display text-[28px] font-bold tracking-[-0.01em] text-fp-text-strong sm:text-[32px]">
          {title}
        </h1>
        <p className="max-w-2xl text-[14px] leading-[1.6] text-fp-text-dim sm:text-[15px]">
          {description}
        </p>
      </header>
      <div className="mt-8 h-px w-full bg-fp-border-default" />
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

function FPLegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-fp-border-default pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-fp-display text-[17px] font-bold tracking-[-0.01em] text-fp-text-strong sm:text-[19px]">
        {title}
      </h2>
      <div className="space-y-3 text-[13px] leading-[1.7] text-fp-text-dim sm:text-[14px]">
        {children}
      </div>
    </section>
  );
}
