import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CAMPUS_SLOT_VARIANT, Campus } from "@/engine/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/adminAuth";

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

async function isAdminAuthed() {
  return isValidAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
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
  if (!(await isAdminAuthed())) {
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

    type ImportCourse = {
      course_code: string;
      course_name: string;
      credits: number;
      course_type: "theory" | "lab" | "both";
      options: Array<{
        professor_name: string;
        program: string | null;
        theory_slots: string[];
        lab_slots: string[];
        professor_notes: string | null;
      }>;
    };

    const courseMap = new Map<string, ImportCourse>();
    let rowsSkipped = 0;

    for (const rawRow of rows as AdminImportRow[]) {
      if (rawRow.isValid === false || rawRow.errors?.length) {
        rowsSkipped += 1;
        continue;
      }

      const courseCode = rawRow.courseCode?.trim().toUpperCase();
      const credits = Number(rawRow.credits) || 3;
      // The import runs as one transaction, so a row the DB would reject
      // (credits is INTEGER 1-10) has to be skipped here or it fails them all.
      if (!courseCode || !Number.isInteger(credits) || credits < 1 || credits > 10) {
        rowsSkipped += 1;
        continue;
      }

      const theorySlots = splitSlots(rawRow.theorySlots);
      const labSlots = splitSlots(rawRow.labSlots);
      const nextCourseType = courseType(theorySlots, labSlots);
      let course = courseMap.get(courseCode);

      if (!course) {
        course = {
          course_code: courseCode,
          course_name: rawRow.courseName?.trim() || courseCode,
          credits,
          course_type: nextCourseType,
          options: []
        };
        courseMap.set(courseCode, course);
      } else {
        course.course_type = mergeCourseType(course.course_type, nextCourseType);
      }

      const option = {
        professor_name: rawRow.professorName?.trim() || "Unknown",
        program: rawRow.program?.trim() || null,
        theory_slots: theorySlots,
        lab_slots: labSlots,
        professor_notes: rawRow.notes?.trim() || null
      };
      // Same key as the course_options_unique constraint: a repeated CSV row
      // would otherwise fail the whole import.
      const isDuplicate = course.options.some(
        (o) =>
          o.professor_name === option.professor_name &&
          o.program === option.program &&
          o.theory_slots.join() === option.theory_slots.join() &&
          o.lab_slots.join() === option.lab_slots.join()
      );
      if (isDuplicate) {
        rowsSkipped += 1;
      } else {
        course.options.push(option);
      }
    }

    // One transaction (supabase/migrations/20261003_import_catalog_rpc.sql):
    // the semester switch, course upserts and option replacement all land
    // together or not at all.
    const { data, error } = await createSupabaseAdminClient().rpc("import_catalog", {
      p_semester: {
        label: semesterLabel.trim(),
        campus: selectedCampus,
        slot_variant: slotVariant,
        is_active: Boolean(isActive),
        ffcs_opens: ffcsOpens || null,
        start_date: startDate || null,
        end_date: endDate || null
      },
      p_courses: Array.from(courseMap.values())
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        semesterId: data.semester_id,
        coursesCreated: data.courses,
        optionsCreated: data.options,
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
