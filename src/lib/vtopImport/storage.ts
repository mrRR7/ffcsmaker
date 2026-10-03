import { nanoid } from "nanoid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlannerImportJSON } from "@/features/vtop-scraper/types";

export const VTOP_IMPORT_TTL_MS = 30 * 60 * 1000;

export function createImportExpiry() {
  return new Date(Date.now() + VTOP_IMPORT_TTL_MS).toISOString();
}

export async function storeVtopImport(payload: PlannerImportJSON) {
  const supabase = createSupabaseAdminClient();
  const id = nanoid(12);
  const expiresAt = createImportExpiry();

  const { error } = await supabase.from("vtop_imports").insert({
    id,
    payload_json: payload,
    campus: payload.campus ?? null,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { token: id, expiresAt };
}

export async function consumeVtopImport(token: string): Promise<PlannerImportJSON | null> {
  const supabase = createSupabaseAdminClient();

  // One DELETE ... RETURNING: two concurrent requests can't both read the
  // payload, so the token really is single-use. Expired rows are left for
  // the nightly pg_cron sweep.
  const { data, error } = await supabase
    .from("vtop_imports")
    .delete()
    .eq("id", token)
    .gt("expires_at", new Date().toISOString())
    .select("payload_json")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.payload_json as PlannerImportJSON | undefined) ?? null;
}
