import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function TermsPage() {
  return (
    <LegalLayout>
      <LegalHeader
        title="Terms of Service"
        description="Welcome to Ultimate FFCS Planner. By using this application, you agree to the following Terms of Service."
      />

      <LegalSection id="purpose" title="Purpose">
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
      </LegalSection>

      <LegalSection id="data-handling" title="Data Handling">
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
      </LegalSection>

      <LegalSection id="no-guarantees" title="No Guarantees">
        <p>
          The application is provided on an “as-is” basis without guarantees of:
        </p>
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
      </LegalSection>

      <LegalSection id="limitation-of-liability" title="Limitation of Liability">
        <p>
          The developer shall not be held responsible for:
        </p>
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
          Use of the application is entirely at the user's own discretion and
          responsibility.
        </p>
      </LegalSection>

      <LegalSection id="open-source-contributions" title="Open Source & Contributions">
        <p>
          Ultimate FFCS Planner is an open-source project.
        </p>
        <p>Users may:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>view the source code</li>
          <li>contribute improvements</li>
          <li>fork the project</li>
          <li>suggest modifications</li>
        </ul>
        <p>subject to the project's applicable open-source license.</p>
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

      <LegalSection id="acceptable-use" title="Acceptable Use">
        <p>
          Users agree not to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>abuse the application infrastructure</li>
          <li>attempt malicious modification of the platform</li>
          <li>exploit vulnerabilities intentionally</li>
          <li>use the application for unlawful purposes</li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="Changes to Terms">
        <p>
          These Terms of Service may be updated periodically to reflect:
        </p>
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
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          For questions, feedback, or concerns regarding these Terms of Service, contact:
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