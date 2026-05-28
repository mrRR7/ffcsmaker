import Link from "next/link";
import { Github, Link2 } from "lucide-react";
import packageJson from "../../../package.json";
import { cn } from "@/utils/cn";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
              <FooterIconLink
                href="https://github.com/mrRR7/ffcsmaker"
                external
                ariaLabel="Open the project GitHub repository in a new tab"
              >
                <Github className="h-4 w-4" />
              </FooterIconLink>

              <div className="space-y-0.5 px-1 sm:px-2">
                <p className="text-sm font-semibold tracking-wide text-foreground">
                  Ultimate FFCS Planner
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Independent student-built timetable planner
                </p>
                <p className="text-[10px] leading-4 text-muted-foreground/70">
                  Made from trauma by mr_RR7
                </p>
              </div>

              <FooterIconLink
                href="https://github.com/mrRR7/ffcsmaker/issues"
                external
                ariaLabel="Report an issue in the project GitHub repository in a new tab"
              >
                <Link2 className="h-4 w-4" />
              </FooterIconLink>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <Link href="/privacy" className="transition hover:text-foreground">
                Privacy Policy
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/terms" className="transition hover:text-foreground">
                Terms of Service
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                href="https://github.com/mrRR7/ffcsmaker"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-foreground"
                aria-label="Open the project GitHub repository in a new tab"
              >
                GitHub
              </Link>
            </div>

            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/55">
              v{packageJson.version} • {currentYear}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterIconLink({
  href,
  children,
  ariaLabel,
  external = false
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "group inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/35 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground hover:shadow-[0_0_0_1px_rgba(45,212,191,0.08),0_0_18px_rgba(45,212,191,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {children}
    </Link>
  );
}