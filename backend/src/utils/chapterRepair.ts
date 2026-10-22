import {
  normalizeChapterNumber,
  sortChapterItems,
  type PdfChapter,
} from "@charan-interiors/shared";

export type NormalizedChapter = PdfChapter;

interface RawChapterInput {
  title?: string | undefined;
  chapter_title?: string | undefined;
  start_page?: number | string | undefined;
  end_page?: number | string | undefined;
  summary?: string | undefined;
  content?: string | undefined;
  extracted_text?: string | undefined;
  key_topics?: unknown[] | undefined;
  word_count?: number | undefined;
  is_explicit_chapter?: boolean | undefined;
  section_type?: "front_matter" | "chapter" | "back_matter" | undefined;
  is_scanned?: boolean | undefined;
  chapter_number?: number | string | undefined;
}

export function validateAndRepairChapters(
  rawChapters: unknown[],
  reportedTotalPages: number,
  fallbackTitle: string
): { chapters: NormalizedChapter[]; totalPages: number } {
  if (!Array.isArray(rawChapters) || rawChapters.length === 0) {
    const singleTotal = Math.max(1, Math.floor(Number(reportedTotalPages) || 1));
    return {
      chapters: [
        {
          chapter_number: 1,
          title: fallbackTitle || "Complete Document",
          chapter_title: fallbackTitle || "Complete Document",
          start_page: 1,
          end_page: singleTotal,
          content: "Full document view.",
          extracted_text: "Full document view.",
          summary: "Complete document read.",
          key_topics: ["Overview"],
          word_count: 0,
          is_explicit_chapter: false,
        },
      ],
      totalPages: singleTotal,
    };
  }

  const sanitized: NormalizedChapter[] = rawChapters.map((item: unknown, idx: number) => {
    const ch = (item && typeof item === "object" ? item : {}) as RawChapterInput;

    const title =
      typeof ch.title === "string" && ch.title.trim()
        ? ch.title.trim()
        : typeof ch.chapter_title === "string" && ch.chapter_title.trim()
          ? ch.chapter_title.trim()
          : `Chapter ${idx + 1}`;

    const rawStart = Number(ch.start_page);
    const rawEnd = Number(ch.end_page);
    const start_page = Number.isFinite(rawStart) && rawStart >= 1 ? Math.floor(rawStart) : idx + 1;
    const end_page =
      Number.isFinite(rawEnd) && rawEnd >= start_page ? Math.floor(rawEnd) : start_page;

    const summary =
      typeof ch.summary === "string" && ch.summary.trim()
        ? ch.summary.trim()
        : `Chapter ${idx + 1} content.`;

    const text =
      typeof ch.extracted_text === "string" && ch.extracted_text.trim()
        ? ch.extracted_text.trim()
        : typeof ch.content === "string" && ch.content.trim()
          ? ch.content.trim()
          : summary;

    const key_topics =
      Array.isArray(ch.key_topics) && ch.key_topics.length > 0
        ? ch.key_topics.map((t) => String(t).trim()).filter(Boolean)
        : [title];

    const word_count =
      typeof ch.word_count === "number" && !Number.isNaN(ch.word_count)
        ? Math.max(0, Math.floor(ch.word_count))
        : text.split(/\s+/).filter(Boolean).length;

    const is_explicit_chapter = Boolean(ch.is_explicit_chapter ?? true);
    const section_type = ch.section_type;
    const is_scanned = Boolean(ch.is_scanned);

    const extractedNum =
      normalizeChapterNumber(ch.chapter_number) ?? normalizeChapterNumber(title) ?? idx + 1;

    const result: NormalizedChapter = {
      chapter_number: extractedNum,
      title,
      start_page,
      end_page,
      content: text,
      summary,
      key_topics,
      word_count,
      is_explicit_chapter,
    };

    if (title) result.chapter_title = title;
    if (text) result.extracted_text = text;
    if (section_type !== undefined) result.section_type = section_type;
    if (is_scanned) result.is_scanned = true;

    return result;
  });

  // Sort chapters strictly in ascending numerical order
  const sorted = sortChapterItems(sanitized);

  // Front-Matter gap check: If first chapter doesn't start at page 1, create a Front Matter section
  const firstChapter = sorted[0];
  if (firstChapter && firstChapter.start_page > 1) {
    const frontEnd = firstChapter.start_page - 1;
    const frontMatterChapter: NormalizedChapter = {
      chapter_number: 1,
      title: "Front Matter & Preface",
      chapter_title: "Front Matter & Preface",
      start_page: 1,
      end_page: frontEnd,
      content: `Preliminary material, table of contents, and front matter covering pages 1 to ${frontEnd}.`,
      extracted_text: "",
      summary: `Preliminary material, table of contents, and front matter covering pages 1 to ${frontEnd}.`,
      key_topics: ["Front Matter", "Preface", "Table of Contents"],
      word_count: 0,
      is_explicit_chapter: false,
      section_type: "front_matter",
      is_scanned: firstChapter.is_scanned,
    };
    sorted.unshift(frontMatterChapter);
    for (let i = 0; i < sorted.length; i++) {
      const ch = sorted[i];
      if (ch && (!ch.is_explicit_chapter || ch.section_type === "front_matter")) {
        ch.chapter_number = i + 1;
      }
    }
  }

  // Contiguous page-range repair: fix gaps & overlaps between adjacent chapters
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;

    if (current.end_page < current.start_page) {
      current.end_page = current.start_page;
    }

    const next = sorted[i + 1];
    if (next) {
      const nextStart = next.start_page;

      if (current.end_page >= nextStart) {
        current.end_page = nextStart > current.start_page ? nextStart - 1 : current.start_page;
      }

      if (current.end_page + 1 < nextStart) {
        current.end_page = nextStart - 1;
      }
    }
  }

  // Ensure the last chapter extends to the reported total pages
  let maxEnd = Math.max(reportedTotalPages, 1);
  for (const ch of sorted) {
    maxEnd = Math.max(maxEnd, ch.end_page);
  }

  // Back-matter gap check
  if (sorted.length > 0 && reportedTotalPages > 0) {
    const lastChapter = sorted[sorted.length - 1];
    if (lastChapter && lastChapter.end_page < reportedTotalPages) {
      const gap = reportedTotalPages - lastChapter.end_page;
      if (gap >= 4) {
        const backStart = lastChapter.end_page + 1;
        sorted.push({
          chapter_number: sorted.length + 1,
          title: "Back Matter & Index",
          chapter_title: "Back Matter & Index",
          start_page: backStart,
          end_page: reportedTotalPages,
          content: `Reference materials, appendices, notes, or index covering pages ${backStart} to ${reportedTotalPages}.`,
          extracted_text: "",
          summary: `Reference materials, appendices, notes, or index covering pages ${backStart} to ${reportedTotalPages}.`,
          key_topics: ["Back Matter", "Index", "References"],
          word_count: 0,
          is_explicit_chapter: false,
          section_type: "back_matter",
          is_scanned: lastChapter.is_scanned,
        });
      } else {
        lastChapter.end_page = reportedTotalPages;
      }
    }
  }

  // Sequential chapter_number pass for unstructured documents without explicit author numbers
  const hasExplicitNumbers = sorted.some(
    (c: NormalizedChapter) =>
      c.is_explicit_chapter &&
      typeof c.chapter_number === "number" &&
      c.chapter_number > 0 &&
      c.section_type !== "front_matter"
  );
  if (!hasExplicitNumbers) {
    for (let i = 0; i < sorted.length; i++) {
      const ch = sorted[i];
      if (ch) ch.chapter_number = i + 1;
    }
  }

  const calculatedTotal = Math.max(
    reportedTotalPages,
    maxEnd,
    sorted.length > 0 && sorted[sorted.length - 1] ? sorted[sorted.length - 1]!.end_page : 1
  );
  return { chapters: sorted, totalPages: calculatedTotal };
}
