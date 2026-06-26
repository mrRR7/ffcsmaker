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

  const { data, error } = await supabase
    .from("vtop_imports")
    .select("payload_json, expires_at")
    .eq("id", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase.from("vtop_imports").delete().eq("id", token);
    return null;
  }

  await supabase.from("vtop_imports").delete().eq("id", token);

  return data.payload_json as PlannerImportJSON;
}
