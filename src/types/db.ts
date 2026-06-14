export interface DBSemester {
  id: string;
  label: string;
  campus: "chennai" | "vellore" | "bhopal" | "ap";
  slot_variant: "standard" | "bhopal" | "ap";
  is_active: boolean;
  ffcs_opens: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface DBCourseOption {
  id: string;
  course_id: string;
  professor_name: string;
  theory_slots: string[];
  lab_slots: string[];
  professor_notes: string | null;
  verified: boolean;
}

export interface DBCourse {
  id: string;
  semester_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  course_type: "theory" | "lab" | "both";
  verified: boolean;
  course_options: DBCourseOption[];
}
