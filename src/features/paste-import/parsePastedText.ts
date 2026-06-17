export interface PastedCourseOption {
  rawLine: string;
  courseCode: string | null;
  courseName: string | null;
  professorName: string | null;
  theorySlotRaw: string | null;
  labSlotRaw: string | null;
  credits: number | null;
  confidence: "high" | "medium" | "low";
  errors: string[];
}

const COURSE_CODE_RE = /\b([A-Z]{2,4}\d{2,4}[A-Z]?)\b/i;
const CREDIT_RE = /\b([1-9])\s*(?:cr|credit|credits)?\b/i;
const LAB_RE = /\bL\d{1,2}(?:\s*\+\s*L\d{1,2})*\b/gi;
const THEORY_RE =
  /\b(?:T?[A-G]{1,2}\d{1,2}|S\d{1,2})(?:\s*\+\s*(?:T?[A-G]{1,2}\d{1,2}|S\d{1,2}))*\b/gi;
const LAB_TEST_RE = /\bL\d{1,2}(?:\s*\+\s*L\d{1,2})*\b/i;
const THEORY_TEST_RE =
  /\b(?:T?[A-G]{1,2}[1-9]|S\d{1,2})(?:\s*\+\s*(?:T?[A-G]{1,2}[1-9]|S\d{1,2}))*\b/i;

function cleanLine(value: string) {
  return value
    .replace(/^\s*\d+[.)-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSlots(value: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*,\s*/g, ", ")
    .trim()
    .toUpperCase();
  return ["-", "NA", "N/A", "NIL", "NONE"].includes(normalized)
    ? null
    : normalized;
}

function findCredits(line: string) {
  const explicit = line.match(/\b([1-9])\s*(?:cr|credit|credits)\b/i);
  if (explicit) {
    return Number(explicit[1]);
  }
  const parenthetical = line.match(/\(([1-9])\)/);
  if (parenthetical) {
    return Number(parenthetical[1]);
  }
  return null;
}

function extractSlots(line: string) {
  const labs = Array.from(line.matchAll(LAB_RE)).map((match) => match[0]);
  const theory = Array.from(line.matchAll(THEORY_RE))
    .map((match) => match[0])
    .filter((slot) => !/^L\d/i.test(slot));

  return {
    theorySlotRaw: normalizeSlots(theory.join(", ")),
    labSlotRaw: normalizeSlots(labs.join(", "))
  };
}

function stripKnownParts(line: string, parts: Array<string | null>) {
  let next = line;
  for (const part of parts) {
    if (!part) {
      continue;
    }
    next = next.replace(part, " ");
  }
  return next
    .replace(/\b(theory|lab|credits?|cr|option)\b/gi, " ")
    .replace(/\b(NIL|NONE|NA|N\/A)\b/gi, " ")
    .replace(/[|/(),:]+/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bestProfessorCandidate(line: string) {
  const segments = line
    .split(/\s*(?:-|\u2013|\||\/)\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !COURSE_CODE_RE.test(segment))
    .filter((segment) => !LAB_TEST_RE.test(segment))
    .filter((segment) => !THEORY_TEST_RE.test(segment))
    .filter((segment) => !/\b(?:theory|lab|option|credits?|cr)\b/i.test(segment));

  return segments.sort((a, b) => b.length - a.length)[0] ?? null;
}

function inferCourseName(line: string, courseCode: string | null, credits: number | null) {
  if (!courseCode) {
    return null;
  }

  const afterCode = line.slice(line.toUpperCase().indexOf(courseCode.toUpperCase()) + courseCode.length);
  const beforeCredits = credits
    ? afterCode.replace(new RegExp(`\\(?\\s*${credits}\\s*(?:cr|credits?)?\\s*\\)?`, "i"), "")
    : afterCode;
  const firstChunk = beforeCredits
    .split(/\s*(?:-|\u2013|\||\/)\s*/)
    .map((segment) => segment.trim())
    .find((segment) => {
      return (
        segment.length > 2 &&
        !LAB_TEST_RE.test(segment) &&
        !THEORY_TEST_RE.test(segment) &&
        !/\b(?:option|theory|lab)\b/i.test(segment)
      );
    });

  return firstChunk ?? null;
}

function confidenceFor(
  courseCode: string | null,
  professorName: string | null,
  theorySlotRaw: string | null,
  labSlotRaw: string | null
) {
  const hasSlot = Boolean(theorySlotRaw || labSlotRaw);
  if (courseCode && professorName && hasSlot) {
    return "high";
  }
  if (courseCode && (professorName || hasSlot)) {
    return "medium";
  }
  return "low";
}

function isProfessorish(value: string) {
  return /^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+/i.test(value);
}

function segmentHints(line: string, courseCode: string | null) {
  const segments = line
    .split(/\s*(?:-|\u2013|\|)\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!courseCode || segments.length < 2) {
    return { courseName: null, professorName: null };
  }

  const firstCodeIndex = segments.findIndex((segment) =>
    segment.toUpperCase().includes(courseCode)
  );
  const candidates = segments
    .slice(firstCodeIndex >= 0 ? firstCodeIndex + 1 : 0)
    .map((segment) => stripKnownParts(segment, [courseCode]))
    .filter(Boolean)
    .filter((segment) => !LAB_TEST_RE.test(segment))
    .filter((segment) => !THEORY_TEST_RE.test(segment))
    .filter((segment) => !/\b(?:option|theory|lab|credits?|cr)\b/i.test(segment));

  if (candidates.length === 0) {
    return { courseName: null, professorName: null };
  }

  const titledProfessor = candidates.find(isProfessorish);
  if (titledProfessor) {
    return {
      courseName: candidates.find((candidate) => candidate !== titledProfessor) ?? null,
      professorName: titledProfessor
    };
  }

  if (candidates.length === 1) {
    return { courseName: null, professorName: candidates[0] };
  }

  return {
    courseName: candidates[0],
    professorName: candidates[candidates.length - 1]
  };
}

function parseLine(
  rawLine: string,
  inherited: { courseCode: string | null; courseName: string | null; credits: number | null }
): PastedCourseOption {
  const line = cleanLine(rawLine);
  const courseCode = line.match(COURSE_CODE_RE)?.[1]?.toUpperCase() ?? inherited.courseCode;
  const credits = findCredits(line) ?? inherited.credits;
  const { theorySlotRaw, labSlotRaw } = extractSlots(line);
  const hints = segmentHints(line, courseCode);
  const courseName =
    inherited.courseName ??
    hints.courseName ??
    (hints.professorName ? null : inferCourseName(line, courseCode, credits));
  const professorSource = stripKnownParts(line, [
    courseCode,
    courseName,
    theorySlotRaw,
    labSlotRaw,
    credits ? String(credits) : null
  ]);
  const professorName =
    hints.professorName ??
    bestProfessorCandidate(professorSource) ??
    (professorSource.length > 1 ? professorSource : null);
  const errors: string[] = [];

  if (!courseCode) {
    errors.push("Course code not found");
  }
  if (!professorName) {
    errors.push("Professor not found");
  }
  if (!theorySlotRaw && !labSlotRaw) {
    errors.push("No slots found");
  }

  return {
    rawLine,
    courseCode,
    courseName,
    professorName,
    theorySlotRaw,
    labSlotRaw,
    credits,
    confidence: confidenceFor(courseCode, professorName, theorySlotRaw, labSlotRaw),
    errors
  };
}

export function parsePastedText(raw: string): PastedCourseOption[] {
  const lines = raw
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
  const parsed: PastedCourseOption[] = [];
  let currentCourse: {
    courseCode: string | null;
    courseName: string | null;
    credits: number | null;
  } = {
    courseCode: null,
    courseName: null,
    credits: null
  };

  for (const line of lines) {
    const code = line.match(COURSE_CODE_RE)?.[1]?.toUpperCase() ?? null;
    const credits = findCredits(line);
    const looksLikeHeader =
      Boolean(code) &&
      /\b(?:credits?|cr)\b/i.test(line) &&
      !/\b(?:option|theory|lab)\b/i.test(line);

    if (looksLikeHeader) {
      currentCourse = {
        courseCode: code,
        courseName: inferCourseName(line, code, credits),
        credits
      };
      continue;
    }

    const option = parseLine(line, currentCourse);
    if (option.courseCode) {
      currentCourse = {
        courseCode: option.courseCode,
        courseName: option.courseName,
        credits: option.credits
      };
    }
    parsed.push(option);
  }

  return parsed;
}
