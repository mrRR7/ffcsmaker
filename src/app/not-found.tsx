import type { Metadata } from "next";
import Link from "next/link";
import { fpButtonVariants } from "@/components/fp-ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <p className="font-fp-mono text-[length:var(--text-small)] text-fp-text-dim">404</p>
      <h1 className="mt-2 font-fp-display text-[28px] font-bold text-fp-text-strong">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
        The link may be old or mistyped. Your courses and saved weeks are still here.
      </p>
      <Link href="/planner" className={fpButtonVariants({ className: "mt-6" })}>
        Open the planner
      </Link>
    </div>
  );
}
