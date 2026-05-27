import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
	return (
		<div className="space-y-6 pb-16">
			<section className="rounded-xl border border-border bg-card/60 p-6">
				<p className="text-sm font-semibold text-primary">Dashboard</p>
				<h1 className="mt-2 text-3xl font-semibold">Schedule workspace overview</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
					Continue where you left off, compare generated options, and tweak constraints
					before your next run.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="p-5">
						<p className="text-sm text-muted-foreground">Planner</p>
						<p className="mt-1 text-2xl font-semibold">Set courses and slots</p>
						<Link
							href="/planner"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
						>
							Open Planner
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-5">
						<p className="text-sm text-muted-foreground">Results</p>
						<p className="mt-1 text-2xl font-semibold">Review generated schedules</p>
						<Link
							href="/results"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
						>
							View Results
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-5">
						<p className="text-sm text-muted-foreground">Saved</p>
						<p className="mt-1 text-2xl font-semibold">Access bookmarked plans</p>
						<Link
							href="/saved"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-background/30 px-4 text-sm font-semibold transition hover:bg-secondary/70"
						>
							Open Saved
						</Link>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
