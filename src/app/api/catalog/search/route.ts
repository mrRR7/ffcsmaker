import { NextResponse } from "next/server";
import { Campus } from "@/engine/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { getCachedSemester, setCachedSemester } from "@/lib/semesterCache";
import { DBCourse, DBSemester } from "@/types/db";

// Short edge cache: still absorbs the registration-week burst, but students
// see an admin catalog import within a few minutes instead of an hour.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
};

// Returns the full catalog for a campus/semester. The client fetches it once
// and filters locally (src/lib/catalogCache.ts).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get("semester");
    const campus = (searchParams.get("campus") ?? "chennai") as Campus;
    const supabase = createServerSupabaseClient();

    let semester: DBSemester | null | undefined = getCachedSemester(campus, semesterId);
    if (semester === undefined) {
      let semesterQuery = supabase
        .from("semesters")
        .select("id, label, campus, slot_variant, is_active, ffcs_opens, start_date, end_date")
        .eq("campus", campus);
      semesterQuery = semesterId
        ? semesterQuery.eq("id", semesterId)
        : semesterQuery.eq("is_active", true);

      const { data } = await semesterQuery.maybeSingle();
      semester = (data as DBSemester | null) ?? null;
      if (semester) {
        setCachedSemester(campus, semesterId, semester);
      }
    }

    if (!semester) {
      return NextResponse.json(
        {
          courses: [],
          semester: null,
          semesterId: null,
          slotVariant: null,
          message: `No active semester found for ${campus}`
        },
        { headers: CACHE_HEADERS }
      );
    }

    const activeSemester = semester;
    const courses = await fetchAllRows<DBCourse>((from, to) =>
      supabase
        .from("courses")
        .select(
          `
          id, semester_id, course_code, course_name, credits, course_type, verified,
          course_options!inner (
            id, course_id, professor_name, program, theory_slots, lab_slots, professor_notes, verified
          )
        `
        )
        .eq("semester_id", activeSemester.id)
        .order("course_code")
        .range(from, to)
    );

    return NextResponse.json(
      {
        courses,
        semester: activeSemester,
        semesterId: activeSemester.id,
        slotVariant: activeSemester.slot_variant ?? null
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("catalog/search failed:", error);
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 500 });
  }
}
