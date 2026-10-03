-- Atomic admin catalog import (src/app/api/admin/courses/bulk/route.ts).
--
-- The route used to run 3-4 sequential queries per course: deactivate the
-- campus's active semester, upsert the semester, then per course upsert,
-- delete its options and re-insert them. Any failure part-way (including the
-- Vercel function timeout on a full catalog) left a campus with no active
-- semester or courses with their options deleted and never re-inserted.
-- This does the same work in one transaction: all of it lands or none does.
--
-- p_semester: {label, campus, slot_variant, is_active, ffcs_opens, start_date, end_date}
-- p_courses:  [{course_code, course_name, credits, course_type,
--               options: [{professor_name, program, theory_slots, lab_slots, professor_notes}]}]

CREATE OR REPLACE FUNCTION import_catalog(p_semester jsonb, p_courses jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_semester_id uuid;
  v_course jsonb;
  v_course_id uuid;
  v_inserted int;
  v_courses int := 0;
  v_options int := 0;
BEGIN
  IF COALESCE((p_semester->>'is_active')::boolean, false) THEN
    UPDATE semesters SET is_active = false
    WHERE campus = p_semester->>'campus' AND is_active;
  END IF;

  INSERT INTO semesters (label, campus, slot_variant, is_active, ffcs_opens, start_date, end_date)
  VALUES (
    p_semester->>'label',
    p_semester->>'campus',
    p_semester->>'slot_variant',
    COALESCE((p_semester->>'is_active')::boolean, false),
    NULLIF(p_semester->>'ffcs_opens', '')::timestamptz,
    NULLIF(p_semester->>'start_date', '')::date,
    NULLIF(p_semester->>'end_date', '')::date
  )
  ON CONFLICT (label, campus) DO UPDATE SET
    slot_variant = EXCLUDED.slot_variant,
    is_active = EXCLUDED.is_active,
    ffcs_opens = EXCLUDED.ffcs_opens,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date
  RETURNING id INTO v_semester_id;

  FOR v_course IN SELECT value FROM jsonb_array_elements(p_courses) LOOP
    INSERT INTO courses (semester_id, course_code, course_name, credits, course_type, verified)
    VALUES (
      v_semester_id,
      v_course->>'course_code',
      v_course->>'course_name',
      (v_course->>'credits')::int,
      v_course->>'course_type',
      true
    )
    ON CONFLICT (semester_id, course_code) DO UPDATE SET
      course_name = EXCLUDED.course_name,
      credits = EXCLUDED.credits,
      course_type = EXCLUDED.course_type,
      verified = true
    RETURNING id INTO v_course_id;
    v_courses := v_courses + 1;

    -- Replace this course's options for each program present in the import;
    -- options for programs not in this import are left alone.
    DELETE FROM course_options co
    WHERE co.course_id = v_course_id
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_course->'options') o
        WHERE (o->>'program') IS NOT DISTINCT FROM co.program
      );

    INSERT INTO course_options
      (course_id, professor_name, program, theory_slots, lab_slots, professor_notes, verified)
    SELECT
      v_course_id,
      o->>'professor_name',
      o->>'program',
      ARRAY(SELECT jsonb_array_elements_text(o->'theory_slots')),
      ARRAY(SELECT jsonb_array_elements_text(o->'lab_slots')),
      o->>'professor_notes',
      true
    FROM jsonb_array_elements(v_course->'options') o;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_options := v_options + v_inserted;
  END LOOP;

  RETURN jsonb_build_object(
    'semester_id', v_semester_id,
    'courses', v_courses,
    'options', v_options
  );
END;
$$;

-- Functions are executable by PUBLIC by default, which would expose this as
-- an anon RPC endpoint. Only the service-role admin client may call it.
REVOKE EXECUTE ON FUNCTION import_catalog(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION import_catalog(jsonb, jsonb) TO service_role;
