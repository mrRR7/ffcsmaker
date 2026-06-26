import type { PlannerImportJSON } from "../types";

export async function uploadResults(
  result: PlannerImportJSON,
  plannerBase: string
): Promise<string> {
  const apiUrl = new URL("/api/vtop-import", plannerBase).toString();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? "Failed to upload scraped data.");
  }

  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    throw new Error("Import token missing from server response.");
  }

  return json.token;
}
