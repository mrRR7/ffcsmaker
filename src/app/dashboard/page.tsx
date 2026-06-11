import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
	return (
		<div className="space-y-6 pb-16">
			<section className="rounded-xl border border-border bg-card/60 p-6">
				<h1 className="text-xl font-semibold text-foreground">Ultimate FFCS</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Academic timetable optimizer and planner.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="p-5">
						<p className="text-lg font-semibold">Planner</p>
						<Link
							href="/planner"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary-hover"
						>
							Open Planner
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-5">
						<p className="text-lg font-semibold">Results</p>
						<Link
							href="/results"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-surface-strong px-4 text-sm font-semibold text-ink transition hover:bg-hairline"
						>
							View Results
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-5">
						<p className="text-lg font-semibold">Saved</p>
						<Link
							href="/saved"
							className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-hairline bg-surface-card px-4 text-sm font-semibold text-ink transition hover:bg-surface-soft"
						>
							Open Saved
						</Link>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
