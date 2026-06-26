import { Campus } from "@/engine/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DBCourse } from "@/types/db";

export async function fetchCatalogForCampus(campus: Campus): Promise<DBCourse[]> {
  const supabase = createSupabaseAdminClient();

  const { data: semester } = await supabase
    .from("semesters")
    .select("id")
    .eq("campus", campus)
    .eq("is_active", true)
    .maybeSingle();

  if (!semester?.id) {
    return [];
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      `
      id, semester_id, course_code, course_name, credits, course_type, verified,
      course_options (
        id, course_id, professor_name, program, theory_slots, lab_slots, professor_notes, verified
      )
    `
    )
    .eq("semester_id", semester.id)
    .order("course_code");

  if (error) {
    throw new Error(error.message);
  }

  return (courses ?? []) as DBCourse[];
}
