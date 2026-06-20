import { NextResponse } from "next/server";
import { Campus } from "@/engine/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const semesterId = searchParams.get("semester");
    const campus = (searchParams.get("campus") ?? "chennai") as Campus;
    const program = searchParams.get("program") as string | null;
    const supabase = createServerSupabaseClient();

    let activeSemesterId = semesterId;
    let semesterQuery = supabase
      .from("semesters")
      .select("id, label, campus, slot_variant, is_active, ffcs_opens, start_date, end_date")
      .eq("campus", campus);

    if (activeSemesterId) {
      semesterQuery = semesterQuery.eq("id", activeSemesterId);
    } else {
      semesterQuery = semesterQuery.eq("is_active", true);
    }

    const { data: sem } = await semesterQuery.single();
    let activeSemester = sem;
    if (!activeSemesterId && sem) {
      activeSemesterId = sem.id;
    }

    if (!activeSemesterId) {
      return NextResponse.json(
        {
          courses: [],
          semester: null,
          semesterId: null,
          slotVariant: null,
          message: `No active semester found for ${campus}`
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
          }
        }
      );
    }

    let coursesQuery = supabase
      .from("courses")
      .select(
        `
        id, semester_id, course_code, course_name, credits, course_type, verified,
        course_options!inner (
          id, course_id, professor_name, program, theory_slots, lab_slots, professor_notes, verified
        )
      `
      )
      .eq("semester_id", activeSemesterId);

    // if (program) {
    //   // The NULL fallback is temporary and intended to support gradual catalog migration.
    //   // Once all course options are classified, the fallback may be removed and filtering can become:
    //   // program.eq.${program}
    //   coursesQuery = coursesQuery.or(`program.eq.${program},program.is.null`, { foreignTable: "course_options" });
    // }

    coursesQuery = coursesQuery.order("course_code");

    if (query.length >= 2) {
      const safeQuery = query.replace(/[,%]/g, "");
      coursesQuery = coursesQuery.or(
        `course_code.ilike.${safeQuery}%,course_name.ilike.%${safeQuery}%`
      );
    }

    const { data: courses, error } = await coursesQuery.limit(query.length >= 2 ? 20 : 50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        courses: courses ?? [],
        semester: activeSemester,
        semesterId: activeSemesterId,
        slotVariant:
          (activeSemester as { slot_variant?: "standard" | "bhopal" | "ap" } | null)
            ?.slot_variant ?? null
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Catalog unavailable" },
      { status: 500 }
    );
  }
}
