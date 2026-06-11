import Link from "next/link";
import { Github, Link2 } from "lucide-react";
import packageJson from "../../../package.json";
import { cn } from "@/utils/cn";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-hairline bg-canvas pt-8 pb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mt-4 flex flex-col items-center gap-4 text-center">
            <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
              <FooterIconLink
                href="https://github.com/mrRR7/ffcsmaker"
                external
                ariaLabel="Open the project GitHub repository in a new tab"
              >
                <Github className="h-4 w-4" />
              </FooterIconLink>

              <div className="space-y-0.5 px-2">
                <p className="text-[15px] font-display font-semibold tracking-tight text-ink">
                  Ultimate FFCS
                </p>
                <p className="text-sm leading-5 text-muted-foreground">
                  Academic timetable optimizer
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

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground mt-2">
              <Link href="/privacy" className="transition hover:text-ink">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-ink">
                Terms of Service
              </Link>
              <Link
                href="https://github.com/mrRR7/ffcsmaker"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-ink"
                aria-label="Open the project GitHub repository in a new tab"
              >
                GitHub
              </Link>
            </div>

            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-soft mt-4">
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
        "group inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-all duration-200 hover:bg-surface-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
    >
      {children}
    </Link>
  );
}