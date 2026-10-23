import { test } from "node:test";
import assert from "node:assert/strict";
import { DBCourse } from "@/types/db";
import { catalogPrograms, programLabel, scopeCatalog } from "./programCatalog";

let nextId = 0;
function course(code: string, rows: Array<[program: string | null, professor: string, theory: string]>): DBCourse {
  return {
    id: code,
    semester_id: "s",
    course_code: code,
    course_name: code,
    credits: 4,
    course_type: "theory",
    verified: true,
    course_options: rows.map(([program, professor, theory]) => ({
      id: `o${nextId++}`,
      course_id: code,
      professor_name: professor,
      program,
      theory_slots: [theory],
      lab_slots: [],
      professor_notes: null,
      verified: true
    }))
  };
}

const compiler = course("BCSE307", [["BCE", "Dr A", "A1"], ["BCE", "Dr B", "B1"], ["BYB", "Dr C", "C1"]]);
const models = course("BACSE201", [["BYB", "Dr D", "D1"], ["BYC", "Dr D", "D1"], ["BDS", "Dr E", "E1"]]);
const elective = course("BAFRE101", [["ALL", "Dr F", "F1"], ["ALL", "Dr G", "G1"]]);
const catalog = [models, elective, compiler];

test("a course tagged to the selected program is yours, with only its rows", () => {
  const { courses, mineCount } = scopeCatalog(catalog, "BCE");
  assert.equal(mineCount, 1);
  assert.equal(courses[0].course_code, "BCSE307");
  assert.deepEqual(courses[0].course_options.map((o) => o.professor_name), ["Dr A", "Dr B"]);
});

test("courses tagged elsewhere or ALL stay findable under All courses, in order", () => {
  const { courses } = scopeCatalog(catalog, "BCE");
  assert.deepEqual(courses.slice(1).map((c) => c.course_code), ["BACSE201", "BAFRE101"]);
});

test("identical options under several programs show once", () => {
  const { courses } = scopeCatalog([models], "BCE");
  assert.deepEqual(
    courses[0].course_options.map((o) => [o.professor_name, o.program]),
    [["Dr D", "BYB/BYC"], ["Dr E", "BDS"]]
  );
  assert.equal(scopeCatalog([elective], "BCE").courses[0].course_options[0].program, null);
});

test("no program: everything is All courses", () => {
  const { courses, mineCount } = scopeCatalog(catalog, null);
  assert.equal(mineCount, 0);
  assert.deepEqual(courses.map((c) => c.course_code), ["BACSE201", "BAFRE101", "BCSE307"]);
  assert.equal(courses[2].course_options.length, 3);
});

test("lists tagged programs only, and unknown codes label as themselves", () => {
  assert.deepEqual(catalogPrograms(catalog).sort(), ["BCE", "BDS", "BYB", "BYC"]);
  assert.equal(programLabel("BCE"), "B.Tech CSE (Core)");
  assert.equal(programLabel("MIA"), "MIA");
});
