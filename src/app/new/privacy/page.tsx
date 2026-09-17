import type { ReactNode } from "react";
import { FPLabel } from "@/components/fp-ui/label";

export default function NewPrivacyPage() {
  return (
    <FPLegalPage
      title="Privacy Policy"
      description="This Privacy Policy describes how Ultimate FFCS Planner handles data when you use the application."
    >
      <FPLegalSection title="Data Storage">
        <p>
          All planner data, including courses, professor selections, generated timetables,
          constraints, preferences, and exported schedule information, is stored locally in
          your browser. No academic information is uploaded, transmitted, or stored on
          external servers controlled by this application.
        </p>
        <p>
          The app is designed to function primarily through local browser storage
          mechanisms. Your planner configuration and generated schedules remain on your
          device unless you explicitly export or share them manually.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Cookies & Analytics">
        <p>
          Ultimate FFCS Planner may use lightweight analytics services such as Vercel
          Analytics or similar privacy-focused tools to collect anonymous aggregate usage
          information, including:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>page visits</li>
          <li>device/browser types</li>
          <li>general interaction metrics</li>
          <li>performance diagnostics</li>
        </ul>
        <p>
          This information is used solely to improve application performance, usability,
          stability, and user experience.
        </p>
        <p>
          No personally identifiable academic information, timetable data, credentials, or
          planner selections are collected through analytics.
        </p>
        <p>The application does not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>sell user data</li>
          <li>create advertising profiles</li>
          <li>share personal information with third parties</li>
          <li>track users across websites</li>
        </ul>
        <p>
          Any analytics cookies are managed under the respective provider privacy policies
          and can be cleared through your browser settings at any time.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Local Storage">
        <p>The application uses browser local storage to save:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>planner settings</li>
          <li>imported course data</li>
          <li>professor preferences</li>
          <li>timetable generations</li>
          <li>saved schedules</li>
          <li>UI preferences</li>
        </ul>
        <p>This data never leaves your device unless explicitly exported by the user.</p>
        <p>
          You may clear all stored planner data at any time through browser storage
          controls or in-app reset functionality.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Exports & Sharing">
        <p>When using export or share features such as:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>PDF export</li>
          <li>PNG export</li>
          <li>JSON export</li>
          <li>timetable sharing</li>
        </ul>
        <p>the generated files are created locally within your browser session.</p>
        <p>Ultimate FFCS Planner does not upload exported schedules to external servers.</p>
      </FPLegalSection>

      <FPLegalSection title="Open Source">
        <p>
          Ultimate FFCS Planner is an independent open-source project created for
          educational, productivity, and experimentation purposes.
        </p>
        <p>
          The source code is publicly accessible through GitHub, and community
          contributions are voluntary and open-source in nature.
        </p>
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

      <FPLegalSection title="Third-Party Services">
        <p>
          The application may rely on third-party libraries, hosting providers, or
          frontend infrastructure services required for operation and deployment.
        </p>
        <p>
          These providers may process minimal technical information necessary for
          application delivery and performance.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Disclaimer">
        <p>
          Ultimate FFCS Planner is an unofficial student-built academic planning tool and
          is not affiliated with, endorsed by, or supported by any university or
          institution.
        </p>
        <p>
          Users are responsible for verifying final registration details, slot
          information, and academic selections through official university systems.
        </p>
      </FPLegalSection>

      <FPLegalSection title="Contact">
        <p>
          For questions, feedback, or concerns regarding this Privacy Policy, you may
          contact:
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
 * Duplicated identically in ../terms/page.tsx since each legal page lives in
 * its own allowed directory.
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
        <FPLabel tone="accent" variant="eyebrow">Legal</FPLabel>
        <h1 className="font-fp-display text-[28px] font-bold tracking-[-0.01em] text-fp-text-strong sm:text-[32px]">
          {title}
        </h1>
        <p className="max-w-2xl text-[14px] leading-[1.6] text-fp-text-dim sm:text-[var(--text-body-size)]">
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
      <h2 className="font-fp-display text-[17px] font-bold tracking-[-0.01em] text-fp-text-strong sm:text-[var(--text-h)]">
        {title}
      </h2>
      <div className="space-y-3 text-[var(--text-small)] leading-[1.7] text-fp-text-dim sm:text-[14px]">
        {children}
      </div>
    </section>
  );
}
