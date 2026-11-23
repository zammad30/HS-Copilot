import { effectiveCode } from "@/entities/classification";
import type { PathLevel } from "@/entities/classification";
import type { StoredClassification } from "../fixtures/classifications.fixtures";
import { HS_CHAPTER_TITLES, HS_HEADING_TITLES } from "./hsTitles";

function digitsOf(code: string): string {
  return code.replace(/\D/g, "");
}

/** Derives the hierarchy of the record's effective code at read time, never
 * stored, so approve, override and undo always yield a path that matches the
 * current code. Returns undefined when the chapter or heading is unknown. */
export function buildClassificationPath(item: StoredClassification): PathLevel[] | undefined {
  const code = effectiveCode(item);
  const digits = digitsOf(code);
  if (digits.length < 6) return undefined;

  const chapterCode = digits.slice(0, 2);
  const headingCode = digits.slice(0, 4);
  const subheadingDigits = digits.slice(0, 6);
  const chapterTitle = HS_CHAPTER_TITLES[chapterCode];
  const headingTitle = HS_HEADING_TITLES[headingCode];
  if (!chapterTitle || !headingTitle) return undefined;

  const subheadingCode = `${headingCode}.${subheadingDigits.slice(4)}`;
  const candidateFor = (predicate: (candidateDigits: string) => boolean) =>
    item.candidates.find((candidate) => predicate(digitsOf(candidate.code)));
  const subheadingCandidate = candidateFor((value) => value.startsWith(subheadingDigits));
  const nationalCandidate = candidateFor((value) => value === digits);

  return [
    { level: "chapter", code: chapterCode, title: chapterTitle },
    { level: "heading", code: headingCode, title: headingTitle },
    {
      level: "subheading",
      code: subheadingCode,
      title: subheadingCandidate?.title ?? `HS subheading ${subheadingCode}`,
    },
    {
      level: "national",
      code,
      title: nationalCandidate?.title ?? `National tariff line ${code}`,
      isSample: true,
    },
  ];
}
