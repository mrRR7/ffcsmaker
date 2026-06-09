import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const semesterId = searchParams.get("semester");
    const supabase = createServerSupabaseClient();

    let activeSemesterId = semesterId;
    let activeSemester = null;

    if (!activeSemesterId) {
      const { data: sem } = await supabase
        .from("semesters")
        .select("id, label, is_active, ffcs_opens, start_date, end_date")
        .eq("is_active", true)
        .single();
      activeSemesterId = sem?.id;
      activeSemester = sem;
    } else {
      const { data: sem } = await supabase
        .from("semesters")
        .select("id, label, is_active, ffcs_opens, start_date, end_date")
        .eq("id", activeSemesterId)
        .single();
      activeSemester = sem;
    }

    if (!activeSemesterId) {
      return NextResponse.json({ courses: [], semester: null });
    }

    let coursesQuery = supabase
      .from("courses")
      .select(
        `
        id, semester_id, course_code, course_name, credits, course_type, verified,
        course_options (
          id, course_id, professor_name, theory_slots, lab_slots, professor_notes, verified
        )
      `
      )
      .eq("semester_id", activeSemesterId)
      .order("course_code");

    if (query.length >= 2) {
      const safeQuery = query.replace(/[,%]/g, "");
      coursesQuery = coursesQuery.or(
        `course_code.ilike.${safeQuery}%,course_name.ilike.%${safeQuery}%`
      );
    }

    const { data: courses, error } = await coursesQuery.limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      courses: courses ?? [],
      semester: activeSemester,
      semesterId: activeSemesterId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 500 }
    );
  }
}
