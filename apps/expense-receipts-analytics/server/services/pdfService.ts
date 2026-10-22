import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { PDFDocument } from "pdf-lib";
import { normalizeChapterNumber, sortChapterItems } from "../../src/utils/chapterSorting.ts";
import { logEvent } from "../logger.ts";

const execFileAsync = promisify(execFile);

export interface NormalizedChapter {
  chapter_number: number;
  title: string;
  chapter_title: string;
  start_page: number;
  end_page: number;
  content: string;
  extracted_text: string;
  summary: string;
  key_topics: string[];
  word_count: number;
  is_explicit_chapter: boolean;
  section_type?: "front_matter" | "chapter" | "back_matter";
  is_scanned?: boolean;
}

export interface PythonExtractorResult {
  document_title?: string;
  total_pages?: number;
  total_chapters?: number;
  has_explicit_structure?: boolean;
  is_scanned_pdf?: boolean;
  ocr_recommended?: boolean;
  total_words?: number;
  chapters?: Array<Record<string, unknown>>;
}

export function resolvePythonExtractorScript(): string {
  if (process.env.PDF_EXTRACTOR_SCRIPT && fs.existsSync(process.env.PDF_EXTRACTOR_SCRIPT)) {
    return process.env.PDF_EXTRACTOR_SCRIPT;
  }
  const candidates = [
    path.resolve(process.cwd(), "scripts/pdf_chapter_extractor.py"),
    path.resolve(process.cwd(), "../scripts/pdf_chapter_extractor.py"),
    path.resolve(process.cwd(), "../../scripts/pdf_chapter_extractor.py"),
    path.resolve(import.meta.dirname, "../../../scripts/pdf_chapter_extractor.py"),
    path.resolve(import.meta.dirname, "../../scripts/pdf_chapter_extractor.py"),
    path.resolve(import.meta.dirname, "../scripts/pdf_chapter_extractor.py"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0]!;
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

  const sanitized: NormalizedChapter[] = rawChapters.map((chItem: unknown, idx: number) => {
    const ch = (chItem && typeof chItem === "object" ? chItem : {}) as Record<string, unknown>;
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
        ? ch.key_topics.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [title];

    const word_count =
      typeof ch.word_count === "number" && !Number.isNaN(ch.word_count)
        ? Math.max(0, Math.floor(ch.word_count))
        : text.split(/\s+/).filter(Boolean).length;

    const is_explicit_chapter = Boolean(ch.is_explicit_chapter ?? true);
    const section_type = ch.section_type as "front_matter" | "chapter" | "back_matter" | undefined;
    const is_scanned = Boolean(ch.is_scanned);

    const extractedNum =
      normalizeChapterNumber(ch.chapter_number as string | number | undefined) ??
      normalizeChapterNumber(title) ??
      idx + 1;

    return {
      chapter_number: extractedNum,
      title,
      chapter_title: title,
      start_page,
      end_page,
      content: text,
      extracted_text: text,
      summary,
      key_topics,
      word_count,
      is_explicit_chapter,
      section_type,
      is_scanned,
    };
  });

  const sorted = sortChapterItems(sanitized);

  if (sorted.length > 0 && sorted[0]!.start_page > 1) {
    const frontEnd = sorted[0]!.start_page - 1;
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
      is_scanned: sorted.length > 0 ? sorted[0]!.is_scanned : false,
    };
    sorted.unshift(frontMatterChapter);
    for (let i = 0; i < sorted.length; i++) {
      if (!sorted[i]!.is_explicit_chapter || sorted[i]!.section_type === "front_matter") {
        sorted[i]!.chapter_number = i + 1;
      }
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (cur.end_page < cur.start_page) {
      cur.end_page = cur.start_page;
    }

    if (i + 1 < sorted.length) {
      const next = sorted[i + 1]!;
      const nextStart = next.start_page;

      if (cur.end_page >= nextStart) {
        cur.end_page = nextStart > cur.start_page ? nextStart - 1 : cur.start_page;
      }

      if (cur.end_page + 1 < nextStart) {
        cur.end_page = nextStart - 1;
      }
    }
  }

  let maxEnd = Math.max(reportedTotalPages, 1);
  for (const ch of sorted) {
    maxEnd = Math.max(maxEnd, ch.end_page);
  }

  if (sorted.length > 0 && reportedTotalPages > 0) {
    const lastChapter = sorted[sorted.length - 1]!;
    if (lastChapter.end_page < reportedTotalPages) {
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

  const hasExplicitNumbers = sorted.some(
    (c) =>
      c.is_explicit_chapter &&
      typeof c.chapter_number === "number" &&
      c.chapter_number > 0 &&
      c.section_type !== "front_matter"
  );
  if (!hasExplicitNumbers) {
    for (let i = 0; i < sorted.length; i++) {
      sorted[i]!.chapter_number = i + 1;
    }
  }

  const calculatedTotal = Math.max(
    reportedTotalPages,
    maxEnd,
    sorted.length > 0 ? sorted[sorted.length - 1]!.end_page : 1
  );
  return { chapters: sorted, totalPages: calculatedTotal };
}

export async function parsePdfWithPdfLib(
  pdfBuffer: Buffer | Uint8Array,
  fileName?: string
): Promise<{
  document_title: string;
  total_pages: number;
  total_chapters: number;
  has_explicit_structure: boolean;
  chapters: NormalizedChapter[];
}> {
  const uint8 = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  const doc = await PDFDocument.load(uint8, { ignoreEncryption: true });
  const totalPages = Math.max(1, doc.getPageCount());

  let metaTitle = doc.getTitle()?.trim() || "";
  if (metaTitle.toLowerCase().endsWith(".pdf")) {
    metaTitle = metaTitle.slice(0, -4);
  }
  const cleanDocTitle =
    metaTitle ||
    (fileName
      ? fileName
          .replace(/\.[a-zA-Z0-9]+$/, "")
          .replace(/[-_]/g, " ")
          .trim()
      : "") ||
    "Untitled Document";

  const numChapters =
    totalPages <= 1
      ? 1
      : totalPages <= 4
        ? totalPages
        : Math.min(10, Math.max(3, Math.round(totalPages / 6)));

  const rawChapters: NormalizedChapter[] = [];
  const pagesPerChapter = Math.max(1, Math.floor(totalPages / numChapters));

  for (let i = 0; i < numChapters; i++) {
    const sp = i === 0 ? 1 : i * pagesPerChapter + 1;
    const ep = i === numChapters - 1 ? totalPages : Math.min(totalPages, (i + 1) * pagesPerChapter);
    const chNum = i + 1;

    let partTitle = `Section ${chNum}: Overview & Analysis (Pages ${sp}–${ep})`;
    let secType: "front_matter" | "chapter" | "back_matter" = "chapter";

    if (numChapters > 2) {
      if (i === 0 && sp === 1) {
        partTitle = `Part 1: Preliminary & Overview (Pages ${sp}–${ep})`;
        secType = "front_matter";
      } else if (i === numChapters - 1 && ep === totalPages) {
        partTitle = `Part ${chNum}: Concluding Synthesis (Pages ${sp}–${ep})`;
        secType = "back_matter";
      } else {
        partTitle = `Part ${chNum}: Core Analysis (Pages ${sp}–${ep})`;
        secType = "chapter";
      }
    } else if (numChapters === 1) {
      partTitle = `${cleanDocTitle} (Complete Document, Pages 1–${totalPages})`;
    }

    rawChapters.push({
      chapter_number: chNum,
      title: partTitle,
      chapter_title: partTitle,
      start_page: sp,
      end_page: ep,
      content: `Extracted logical section ${chNum} of ${cleanDocTitle}, covering pages ${sp} to ${ep}.`,
      extracted_text: `Extracted logical section ${chNum} of ${cleanDocTitle}, covering pages ${sp} to ${ep}.`,
      summary: `Logical section ${chNum} covering document progression from page ${sp} through page ${ep}.`,
      key_topics: [cleanDocTitle, `Pages ${sp}–${ep}`],
      word_count: 0,
      is_explicit_chapter: false,
      section_type: secType,
    });
  }

  const { chapters: normalizedChapters, totalPages: calculatedTotal } = validateAndRepairChapters(
    rawChapters,
    totalPages,
    cleanDocTitle
  );

  return {
    document_title: cleanDocTitle,
    total_pages: calculatedTotal,
    total_chapters: normalizedChapters.length,
    has_explicit_structure: false,
    chapters: normalizedChapters,
  };
}

export async function runPythonChapterExtractor(
  pdfBuffer: Buffer,
  documentTitle: string
): Promise<{ success: boolean; result: PythonExtractorResult | null }> {
  const tempId = `shoebox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.pdf`;
  const tempFilePath = path.join(os.tmpdir(), tempId);
  const scriptPath = resolvePythonExtractorScript();

  try {
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    const { stdout } = await execFileAsync("python3", [scriptPath, tempFilePath, documentTitle], {
      maxBuffer: 64 * 1024 * 1024,
    });

    if (stdout && stdout.trim()) {
      const parsed = JSON.parse(stdout.trim()) as PythonExtractorResult;
      if (parsed && Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
        return { success: true, result: parsed };
      }
      return { success: false, result: parsed };
    }
    return { success: false, result: null };
  } catch (pyErr) {
    logEvent("WARN python-extractor execution notice", {
      err: pyErr instanceof Error ? pyErr.message : String(pyErr),
      scriptPath,
    });
    return { success: false, result: null };
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch {
      // ignore cleanup error
    }
  }
}
