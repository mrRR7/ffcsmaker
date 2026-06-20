import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CAMPUS_SLOT_VARIANT, Campus } from "@/engine/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminImportRow = {
  courseCode?: string;
  courseName?: string;
  professorName?: string;
  program?: string | null;
  theorySlots?: string | string[];
  labSlots?: string | string[];
  credits?: string | number;
  notes?: string;
  errors?: string[];
  isValid?: boolean;
};

function isAdminAuthed() {
  return cookies().get("admin_session")?.value === process.env.ADMIN_SECRET_KEY;
}

function splitSlots(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((slot) => slot.trim().toUpperCase()).filter(Boolean);
  }
  if (!value) {
    return [];
  }
  if (["-", "NA", "N/A", "NIL", "NONE"].includes(value.trim().toUpperCase())) {
    return [];
  }
  return value
    .split(/[,+/ ]+/)
    .map((slot) => slot.trim().toUpperCase())
    .filter(Boolean);
}

function courseType(theorySlots: string[], labSlots: string[]) {
  if (theorySlots.length > 0 && labSlots.length > 0) {
    return "both";
  }
  if (labSlots.length > 0) {
    return "lab";
  }
  return "theory";
}

function mergeCourseType(
  current: "theory" | "lab" | "both",
  next: "theory" | "lab" | "both"
) {
  return current === next ? current : "both";
}

export async function POST(request: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      semesterLabel,
      campus = "chennai",
      isActive,
      ffcsOpens,
      startDate,
      endDate,
      rows
    } = await request.json();
    const selectedCampus = campus as Campus;
    const slotVariant = CAMPUS_SLOT_VARIANT[selectedCampus];

    if (!semesterLabel || typeof semesterLabel !== "string") {
      return NextResponse.json(
        { error: "Semester label is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Rows must be an array" }, { status: 400 });
    }

    if (!slotVariant) {
      return NextResponse.json({ error: "Invalid campus" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    if (isActive) {
      const { error: deactivateError } = await supabaseAdmin
        .from("semesters")
        .update({ is_active: false })
        .eq("is_active", true)
        .eq("campus", selectedCampus);

      if (deactivateError) {
        return NextResponse.json(
          { error: deactivateError.message },
          { status: 500 }
        );
      }
    }

    const { data: semester, error: semError } = await supabaseAdmin
      .from("semesters")
      .upsert(
        {
          label: semesterLabel.trim(),
          campus: selectedCampus,
          slot_variant: slotVariant,
          is_active: Boolean(isActive),
          ffcs_opens: ffcsOpens || null,
          start_date: startDate || null,
          end_date: endDate || null
        },
        { onConflict: "label,campus" }
      )
      .select("id")
      .single();

    if (semError || !semester) {
      return NextResponse.json(
        { error: semError?.message ?? "Failed to upsert semester" },
        { status: 500 }
      );
    }

    const courseMap = new Map<
      string,
      {
        course: {
          semester_id: string;
          course_code: string;
          course_name: string;
          credits: number;
          course_type: "theory" | "lab" | "both";
          verified: boolean;
        };
        options: Array<{
          professor_name: string;
          program: string | null;
          theory_slots: string[];
          lab_slots: string[];
          professor_notes: string | null;
          verified: boolean;
        }>;
      }
    >();

    let rowsSkipped = 0;

    for (const rawRow of rows as AdminImportRow[]) {
      if (rawRow.isValid === false || rawRow.errors?.length) {
        rowsSkipped += 1;
        continue;
      }

      const courseCode = rawRow.courseCode?.trim().toUpperCase();
      if (!courseCode) {
        rowsSkipped += 1;
        continue;
      }

      const theorySlots = splitSlots(rawRow.theorySlots);
      const labSlots = splitSlots(rawRow.labSlots);
      const credits = Number(rawRow.credits) || 3;

      const nextCourseType = courseType(theorySlots, labSlots);
      const existingCourse = courseMap.get(courseCode);

      if (!existingCourse) {
        courseMap.set(courseCode, {
          course: {
            semester_id: semester.id,
            course_code: courseCode,
            course_name: rawRow.courseName?.trim() || courseCode,
            credits,
            course_type: nextCourseType,
            verified: true
          },
          options: []
        });
      } else if (existingCourse.course.course_type !== nextCourseType) {
        existingCourse.course.course_type = mergeCourseType(
          existingCourse.course.course_type,
          nextCourseType
        );
      }

      courseMap.get(courseCode)!.options.push({
        professor_name: rawRow.professorName?.trim() || "Unknown",
        program: rawRow.program?.trim() || null,
        theory_slots: theorySlots,
        lab_slots: labSlots,
        professor_notes: rawRow.notes?.trim() || null,
        verified: true
      });
    }

    let coursesCreated = 0;
    let optionsCreated = 0;

    for (const { course, options } of courseMap.values()) {
      const { data: upsertedCourse, error: courseErr } = await supabaseAdmin
        .from("courses")
        .upsert(course, { onConflict: "semester_id,course_code" })
        .select("id")
        .single();

      if (courseErr || !upsertedCourse) {
        rowsSkipped += options.length;
        continue;
      }

      coursesCreated += 1;

      if (options.length > 0) {
        const uniquePrograms = Array.from(new Set(options.map((opt) => opt.program)));
        for (const prog of uniquePrograms) {
          let deleteQuery = supabaseAdmin
            .from("course_options")
            .delete()
            .eq("course_id", upsertedCourse.id);

          if (prog === null) {
            deleteQuery = deleteQuery.is("program", null);
          } else {
            deleteQuery = deleteQuery.eq("program", prog);
          }

          const { error: delErr } = await deleteQuery;
          if (delErr) {
            console.error("Error deleting course options for program:", prog, delErr);
          }
        }
      } else {
        await supabaseAdmin
          .from("course_options")
          .delete()
          .eq("course_id", upsertedCourse.id);
      }

      if (options.length === 0) {
        continue;
      }

      const { error: optErr } = await supabaseAdmin.from("course_options").insert(
        options.map((option) => ({
          ...option,
          course_id: upsertedCourse.id
        }))
      );

      if (optErr) {
        rowsSkipped += options.length;
      } else {
        optionsCreated += options.length;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        semesterId: semester.id,
        coursesCreated,
        optionsCreated,
        rowsSkipped
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
