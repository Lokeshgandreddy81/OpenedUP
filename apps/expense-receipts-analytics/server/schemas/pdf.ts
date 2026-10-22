import { z } from "zod";
import { Type } from "@google/genai";

export const parsePdfRequestSchema = z.object({
  mimeType: z.string().optional().default("application/pdf"),
  base64Data: z.string().min(1, "No PDF data provided."),
  fileName: z.string().optional(),
});

export type ParsePdfRequest = z.infer<typeof parsePdfRequestSchema>;

export const PDF_PARSE_SYSTEM_INSTRUCTION = `You are an expert document structuring engine. Your task is to analyze an entire PDF document and extract clean, sequential chapter and section boundaries.

Guiding Principles:
1. Complete Document Coverage: Every page from page 1 to the final page must be accounted for across the chapters. There must be NO skipped pages and NO overlapping page ranges.
2. Structure Recognition:
   - If the document has a Table of Contents (TOC) or outline bookmarks, inspect ALL levels of the hierarchy. If chapters are nested under 'Parts' or 'Units', extract the individual chapters (or include standalone un-nested sections like Preface, Introduction, Appendix, Conclusion). Do NOT discard the TOC just because headings are across multiple indentation levels or have an overarching book title. Use explicit TOC entries as exact chapter boundaries. Set is_explicit_chapter = true.
   - Front-Matter & Back-Matter Recognition: Treat preliminary materials (Cover, Table of Contents, Preface, Foreword, Acknowledgments, Dedication, Executive Summary) as distinct front-matter sections starting on page 1 rather than lumping them into Chapter 1. Similarly, treat reference sections (Appendices, Bibliography, References, Works Cited, Index, Glossary, Endnotes) as distinct back-matter sections rather than swallowing them into the final chapter.
   - FALLBACK (Unstructured Documents): Only if the document genuinely has NO Table of Contents, headings, or structural divisions, semantically partition it into 3 to 10 balanced chapters based on topical progression. Set is_explicit_chapter = false.
3. For each chapter:
   - title: Clear, concise chapter title.
   - start_page: Starting page number in the PDF (1-based integer).
   - end_page: Ending page number in the PDF (1-based integer, inclusive).
   - summary: High-value 2-4 sentence summary of core insights.
   - content: Detailed chapter overview (100–300 words), highlighting key arguments and section anchors.
   - key_topics: 2-5 core concepts or tags.
   - word_count: Word count estimate for this chapter.
4. Strict Ordering: Chapters must be ordered sequentially (chapter_number = 1, 2, 3...).
5. If the PDF is completely blank or corrupt, return an empty chapters list with total_chapters = 0.
6. Scanned / Image-Only PDFs: If the document contains scanned images or photocopies without an embedded text layer, perform visual OCR on each page to read chapter titles, section boundaries, and page contents accurately.`;

export const PDF_PARSE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_title: {
      type: Type.STRING,
      description: "The document title from the title page or inferred from content.",
    },
    total_pages: {
      type: Type.NUMBER,
      description: "Total number of pages in the PDF.",
    },
    total_chapters: {
      type: Type.NUMBER,
      description: "Total number of chapters or sections found/inferred.",
    },
    has_explicit_structure: {
      type: Type.BOOLEAN,
      description:
        "True if the document has explicit chapter/section headings; false if structure was inferred.",
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chapter_number: {
            type: Type.NUMBER,
            description: "1-based chapter/section number in document order.",
          },
          title: {
            type: Type.STRING,
            description: "Title of the chapter/section as printed or inferred.",
          },
          start_page: {
            type: Type.NUMBER,
            description: "Starting page number (1-based).",
          },
          end_page: {
            type: Type.NUMBER,
            description: "Ending page number (1-based, inclusive).",
          },
          content: {
            type: Type.STRING,
            description: "Detailed chapter overview highlighting core concepts and anchors.",
          },
          summary: {
            type: Type.STRING,
            description: "Brief 2-4 sentence summary of this chapter.",
          },
          key_topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-5 key topics or themes in this chapter.",
          },
          word_count: {
            type: Type.NUMBER,
            description: "Estimated number of words in this chapter.",
          },
          is_explicit_chapter: {
            type: Type.BOOLEAN,
            description:
              "True if chapter boundary came from explicit document structure; false if inferred.",
          },
        },
        required: [
          "chapter_number",
          "title",
          "start_page",
          "end_page",
          "content",
          "summary",
          "key_topics",
          "word_count",
          "is_explicit_chapter",
        ],
      },
    },
  },
  required: [
    "document_title",
    "total_pages",
    "total_chapters",
    "has_explicit_structure",
    "chapters",
  ],
};
