import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <LegalHeader
        title="Privacy Policy"
        description="This Privacy Policy describes how Ultimate FFCS Planner handles data when you use the application."
      />

      <LegalSection id="data-storage" title="Data Storage">
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
      </LegalSection>

      <LegalSection id="cookies-analytics" title="Cookies & Analytics">
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
      </LegalSection>

      <LegalSection id="local-storage" title="Local Storage">
        <p>
          The application uses browser local storage to save:
        </p>
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
      </LegalSection>

      <LegalSection id="exports-sharing" title="Exports & Sharing">
        <p>
          When using export or share features such as:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>PDF export</li>
          <li>PNG export</li>
          <li>JSON export</li>
          <li>timetable sharing</li>
        </ul>
        <p>
          the generated files are created locally within your browser session.
        </p>
        <p>Ultimate FFCS Planner does not upload exported schedules to external servers.</p>
      </LegalSection>

      <LegalSection id="open-source" title="Open Source">
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
            className="text-foreground underline-offset-4 transition hover:underline"
          >
            https://github.com/mrRR7/ffcsmaker
          </a>
        </p>
      </LegalSection>

      <LegalSection id="third-party-services" title="Third-Party Services">
        <p>
          The application may rely on third-party libraries, hosting providers, or
          frontend infrastructure services required for operation and deployment.
        </p>
        <p>
          These providers may process minimal technical information necessary for
          application delivery and performance.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" title="Disclaimer">
        <p>
          Ultimate FFCS Planner is an unofficial student-built academic planning tool and
          is not affiliated with, endorsed by, or supported by any university or
          institution.
        </p>
        <p>
          Users are responsible for verifying final registration details, slot
          information, and academic selections through official university systems.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
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
            className="text-foreground underline-offset-4 transition hover:underline"
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
            className="text-foreground underline-offset-4 transition hover:underline"
          >
            https://github.com/mrRR7/ffcsmaker
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}