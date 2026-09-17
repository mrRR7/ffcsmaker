"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";
import { FPButton } from "@/components/fp-ui/button";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-transparent bg-fp-bg-inset px-3 py-2 text-[length:var(--text-small)] text-fp-text-body placeholder:text-fp-text-dim focus:border-[var(--border-selected)] focus:outline-none disabled:opacity-60";

export default function NewAdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Wrong password");
      return;
    }

    router.replace("/new/admin");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <FPCard className="w-full max-w-md" padding="lg">
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-fp-accent"
          style={{ backgroundColor: "var(--accent-wash)" }}
        >
          <LockKeyhole className="h-5 w-5" />
        </div>
        <FPLabel tone="accent" variant="eyebrow">FFCS admin</FPLabel>
        <h1 className="mt-2 font-fp-display text-[length:var(--text-title)] font-bold text-fp-text-strong">Admin login</h1>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-password">
              <FPLabel>Password</FPLabel>
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </div>
          {error ? <p className="text-[length:var(--text-small)] text-fp-danger">{error}</p> : null}
          <FPButton type="submit" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Checking" : "Enter"}
          </FPButton>
        </form>
      </FPCard>
    </div>
  );
}
