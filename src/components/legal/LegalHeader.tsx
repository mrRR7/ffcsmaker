export function LegalHeader({
  title,
  description,
  updatedAt
}: {
  title: string;
  description: string;
  updatedAt?: string;
}) {
  return (
    <header className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
          Legal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {updatedAt ? (
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
          Last updated {updatedAt}
        </p>
      ) : null}
    </header>
  );
}