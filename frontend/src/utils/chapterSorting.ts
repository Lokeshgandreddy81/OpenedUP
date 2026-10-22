/**
 * Clean chapter normalization and sequential numerical sorting logic.
 * Handles integer numbers, numeric strings, Roman numerals, word numbers,
 * and prefixed strings (e.g. "Chapter 32", "Ch. IV", "Section 5").
 */

// Mapping of word numbers up to one hundred
const WORD_TO_INT: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

/**
 * Converts a Roman numeral string (e.g. "IV", "XXXII", "ix", "XXVI") to an integer (e.g. 4, 32, 9, 26).
 * Returns null if the string is not a valid Roman numeral.
 */
export function romanToInteger(str: string): number | null {
  if (!str) return null;
  const clean = str.trim().toUpperCase();

  // Valid standard Roman numerals up to 3999
  const romanRegex = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  if (!romanRegex.test(clean) || clean.length === 0) {
    return null;
  }

  const romanMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    const curr = romanMap[clean[i]];
    const next = romanMap[clean[i + 1]];
    if (next && curr < next) {
      total -= curr;
    } else {
      total += curr;
    }
  }

  return total > 0 ? total : null;
}

/**
 * Converts spelled-out English numbers (e.g. "three", "twenty-six", "thirty two") to an integer.
 * Returns null if not recognizable as a number.
 */
export function wordNumberToInteger(str: string): number | null {
  if (!str) return null;
  const clean = str.toLowerCase().trim().replace(/[-_]/g, " ");
  const parts = clean.split(/\s+/);

  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const part of parts) {
    if (WORD_TO_INT[part] !== undefined) {
      matchedAny = true;
      const val = WORD_TO_INT[part];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val >= 20) {
        current += val;
      } else {
        current += val;
      }
    } else {
      if (matchedAny) break;
    }
  }

  if (!matchedAny) return null;
  total += current;
  return total > 0 ? total : null;
}

/**
 * Normalizes any raw chapter representation (number, Roman numeral string,
 * prefixed string such as "Chapter 32" or "Ch. IV", etc.) into a clean positive integer.
 */
export function normalizeChapterNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  // 1. Direct positive finite number (including 0 for front-matter)
  if (typeof raw === "number") {
    if (!Number.isNaN(raw) && Number.isFinite(raw) && raw >= 0) {
      return Math.floor(raw);
    }
    return null;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // 2. Front-matter keywords (e.g. "Preface", "Table of Contents", "Front Matter")
  if (
    /^(?:front\s+matter|preface|foreword|prologue|table\s+of\s+contents|contents|acknowledgements?|dedication|executive\s+summary|abstract)\b/i.test(
      str
    )
  ) {
    return 0;
  }

  // 2.5 Back-matter keywords (e.g. "Bibliography", "References", "Index", "Glossary")
  if (
    /^(?:back\s+matter|bibliography|references|works\s+cited|index|subject\s+index|glossary|epilogue|afterword|colophon)\b/i.test(
      str
    )
  ) {
    return 2000;
  }

  // 2.6 Pure digits string: "32", "05"
  if (/^\d+$/.test(str)) {
    const val = parseInt(str, 10);
    return !Number.isNaN(val) && val >= 0 ? val : null;
  }

  // 3. Strip standard chapter/section/part/course/module prefixes (English & multi-lingual)
  // e.g. "Chapter 32", "Ch. 4", "Section IV", "Unit 3", "Module 5", "Lesson 2", "Topic 6", "Week 4", "Lecture 10", "Episode 8", "Capítulo 3", "Kapitel 4", "Chapitre 2"
  const prefixRegex =
    /^(?:chapter|chap|ch|section|sec|part|pt|unit|module|mod|lesson|topic|week|wk|lecture|lec|episode|ep|book|vol|volume|act|session|stage|phase|step|grade|level|paper|article|appendix|app|annex|capítulo|capitulo|cap|sección|seccion|secc|parte|unidad|módulo|modulo|lección|leccion|tema|apéndice|apendice|chapitre|partie|unité|unite|leçon|lecon|thème|theme|annexe|appendice|kapitel|abschnitt|teil|lektion|vorlesung|einheit|anhang|sezione|lezione|argomento)\b[\s.:#-]*(.*)$/i;
  const prefixMatch = str.match(prefixRegex);

  if (prefixMatch) {
    const candidate = prefixMatch[1].trim();

    // Leading digits in candidate (e.g. "32", "32: Title", "32 - Introduction")
    const leadDigits = candidate.match(/^(\d+)/);
    if (leadDigits) {
      const val = parseInt(leadDigits[1], 10);
      if (!Number.isNaN(val) && val > 0) return val;
    }

    // Lettered candidate (e.g. "Appendix A", "Appendix B", "Annex C")
    const letterMatch = candidate.match(/^([A-Za-z])\b/);
    if (letterMatch) {
      const charCode = letterMatch[1].toUpperCase().charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) {
        return 1000 + (charCode - 64);
      }
    }

    // Roman numeral in candidate (e.g. "IV", "XXXII", "IX: Methods")
    const romanMatch = candidate.match(/^([IVXLCDMivxlcdm]+)\b/);
    if (romanMatch) {
      const rVal = romanToInteger(romanMatch[1]);
      if (rVal !== null) return rVal;
    }

    // Word number in candidate (e.g. "Thirty Two", "Three: Summary")
    const wordVal = wordNumberToInteger(candidate);
    if (wordVal !== null) return wordVal;
  }

  // 4. Standalone Roman numeral (e.g. "IV", "XXXII", "xxvi")
  const standaloneRoman = romanToInteger(str);
  if (standaloneRoman !== null) return standaloneRoman;

  // 5. Embedded "Chapter <N>" pattern within a larger text
  // e.g. "Textbook Title - Chapter 32: Concluding Analysis"
  const embeddedMatch = str.match(
    /\b(?:chapter|chap|ch|section|sec|part|pt)\b[\s.:#-]*([a-z0-9\s-]+)/i
  );
  if (embeddedMatch) {
    const sub = embeddedMatch[1].trim();
    const d = sub.match(/^(\d+)/);
    if (d) {
      const val = parseInt(d[1], 10);
      if (!Number.isNaN(val) && val > 0) return val;
    }
    const r = sub.match(/^([IVXLCDMivxlcdm]+)\b/);
    if (r) {
      const rVal = romanToInteger(r[1]);
      if (rVal !== null) return rVal;
    }
    const w = wordNumberToInteger(sub);
    if (w !== null) return w;
  }

  // 6. Numbered item prefix: e.g. "32. Methods and Results" or "4 - Discussion"
  const leadingNumbered = str.match(/^(\d+)[\s.:-]/);
  if (leadingNumbered) {
    const val = parseInt(leadingNumbered[1], 10);
    if (!Number.isNaN(val) && val > 0) return val;
  }

  // 7. Roman numeral prefix: e.g. "IV. Discussion"
  const leadingRoman = str.match(/^([IVXLCDMivxlcdm]+)[\s.:-]/);
  if (leadingRoman) {
    const rVal = romanToInteger(leadingRoman[1]);
    if (rVal !== null) return rVal;
  }

  // 8. Word number
  const directWord = wordNumberToInteger(str);
  if (directWord !== null) return directWord;

  // 9. First digit sequence found anywhere as fallback
  const anyDigits = str.match(/(\d+)/);
  if (anyDigits) {
    const val = parseInt(anyDigits[1], 10);
    if (!Number.isNaN(val) && val > 0) return val;
  }

  return null;
}

/**
 * Extracts a normalized integer chapter number from any object shape
 * (e.g. PdfChapter, ReceiptRow, ComputedRow, MerchantTileData, or raw API response).
 */
export function extractChapterNumberFromObject(obj: any): number {
  if (!obj) return Infinity;

  // 1. Direct chapter_number property
  if (obj.chapter_number !== undefined && obj.chapter_number !== null) {
    const norm = normalizeChapterNumber(obj.chapter_number);
    if (norm !== null) return norm;
  }

  // 2. First receipt inside MerchantTileData
  const firstReceipt =
    Array.isArray(obj.receipts) && obj.receipts.length > 0 ? obj.receipts[0] : null;

  if (firstReceipt) {
    if (firstReceipt.chapter_number !== undefined && firstReceipt.chapter_number !== null) {
      const norm = normalizeChapterNumber(firstReceipt.chapter_number);
      if (norm !== null) return norm;
    }
    if (firstReceipt.chapter_title) {
      const norm = normalizeChapterNumber(firstReceipt.chapter_title);
      if (norm !== null) return norm;
    }
    if (firstReceipt.merchant) {
      const norm = normalizeChapterNumber(firstReceipt.merchant);
      if (norm !== null) return norm;
    }
  }

  // 3. Chapter title or general title
  if (obj.chapter_title) {
    const norm = normalizeChapterNumber(obj.chapter_title);
    if (norm !== null) return norm;
  }
  if (obj.title) {
    const norm = normalizeChapterNumber(obj.title);
    if (norm !== null) return norm;
  }

  // 4. Merchant name or tile name
  if (obj.name) {
    const norm = normalizeChapterNumber(obj.name);
    if (norm !== null) return norm;
  }
  if (obj.merchant) {
    const norm = normalizeChapterNumber(obj.merchant);
    if (norm !== null) return norm;
  }

  // 5. Fallback: starting page number
  if (typeof obj.start_page === "number" && !Number.isNaN(obj.start_page) && obj.start_page > 0) {
    return obj.start_page;
  }
  if (
    firstReceipt &&
    typeof firstReceipt.start_page === "number" &&
    !Number.isNaN(firstReceipt.start_page) &&
    firstReceipt.start_page > 0
  ) {
    return firstReceipt.start_page;
  }

  // 6. Fallback: row index
  if (typeof obj.row === "number" && !Number.isNaN(obj.row)) {
    return obj.row;
  }
  if (firstReceipt && typeof firstReceipt.row === "number" && !Number.isNaN(firstReceipt.row)) {
    return firstReceipt.row;
  }

  return Infinity;
}

/**
 * Checks whether an object represents a chapter (tile, row, or chapter object).
 */
export function isChapterItem(item: any): boolean {
  if (!item) return false;
  if (item.chapter_number !== undefined || item.start_page !== undefined) return true;
  if (item.chapter_title !== undefined) return true;
  const firstReceipt = Array.isArray(item.receipts) ? item.receipts[0] : null;
  if (firstReceipt) {
    if (firstReceipt.chapter_number !== undefined || firstReceipt.start_page !== undefined) {
      return true;
    }
    if (firstReceipt.chapter_title !== undefined) return true;
  }
  if (typeof item.name === "string" && /^(?:chapter|ch\.?|section|sec\.?)\b/i.test(item.name)) {
    return true;
  }
  return false;
}

/**
 * Sorts any array of chapter objects, rows, or tiles for reading order.
 *
 * Hierarchical 2-Level Composite Sorting:
 * 1. Document sequence (`docIndex`): ensures Document 1 chapters strictly precede Document 2 chapters.
 * 2. Physical page order (`pageA - pageB`): document ground truth within the same document.
 * 3. Chapter number (`numA - numB`): numerical chapter normalization within the same document.
 * 4. Tie-breakers: start_page and row index.
 */
export function sortChapterItems<T>(items: T[]): T[] {
  if (!items || items.length <= 1) return items ? [...items] : [];

  const docIndexOf = (obj: any): number => {
    const d =
      obj?.doc_index ??
      obj?.docIndex ??
      obj?.receipts?.[0]?.doc_index ??
      obj?.receipts?.[0]?.docIndex ??
      obj?.photo_index ??
      obj?.receipts?.[0]?.photo_index;
    return typeof d === "number" && Number.isFinite(d) && d > 0 ? d : 1;
  };

  const pageOf = (obj: any): number | null => {
    const p = obj?.start_page ?? obj?.receipts?.[0]?.start_page;
    return typeof p === "number" && Number.isFinite(p) && p > 0 ? p : null;
  };

  return [...items].sort((a, b) => {
    // Level 1: Document sequence (Doc 1 < Doc 2 < Doc 3)
    const docA = docIndexOf(a);
    const docB = docIndexOf(b);
    if (docA !== docB) {
      return docA - docB;
    }

    // Level 2: Within the same document
    // Physical page position: the document's physical order outranks parsed numbers.
    const pageA = pageOf(a);
    const pageB = pageOf(b);
    if (pageA !== null && pageB !== null && pageA !== pageB) {
      return pageA - pageB;
    }

    const numA = extractChapterNumberFromObject(a);
    const numB = extractChapterNumberFromObject(b);
    if (numA !== numB) {
      return numA - numB;
    }

    // Tie-breaker 1: start_page (page-less items last)
    if (pageA !== pageB) {
      return (pageA ?? 0) - (pageB ?? 0);
    }

    // Tie-breaker 2: row number
    const rowA = (a as any)?.row ?? (a as any)?.receipts?.[0]?.row ?? 0;
    const rowB = (b as any)?.row ?? (b as any)?.receipts?.[0]?.row ?? 0;
    return rowA - rowB;
  });
}

const CHAPTER_LABELS = new Set([
  "chapter",
  "chap",
  "ch",
  "section",
  "sec",
  "part",
  "pt",
  "unit",
  "module",
  "mod",
  "lesson",
  "topic",
  "week",
  "wk",
  "lecture",
  "lec",
  "episode",
  "ep",
  "book",
  "vol",
  "volume",
  "appendix",
  "annex",
]);

/**
 * Strips a leading chapter label from a title when it merely repeats the
 * number shown in the chapter's own column ("Chapter 4: Memory" → "Memory",
 * "Ch. IV – Memory" → "Memory"). Only strips when the prefix numeral parses
 * to `chapterNumber`; mismatched or unparseable prefixes stay untouched.
 */
export function stripChapterNumberPrefix(title: string, chapterNumber: unknown): string {
  const raw = (title || "").trim();
  if (!raw) return raw;
  const target = normalizeChapterNumber(chapterNumber);
  if (target === null) return raw;

  const parseNumeral = (token: string): number | null => {
    if (/^\d+$/.test(token)) {
      const v = parseInt(token, 10);
      return Number.isNaN(v) ? null : v;
    }
    const roman = romanToInteger(token);
    if (roman !== null) return roman;
    return wordNumberToInteger(token);
  };

  // "Chapter 4: Memory", "Ch. IV – Memory", "Module 12 Memory"
  const labeled = raw.match(/^([A-Za-zÀ-ÿ]+)\.?\s*[.:#-]?\s*([A-Za-z0-9]+)\s*[.:)\-–—]?\s+(.+)$/);
  if (labeled) {
    const [, label, numeral, rest] = labeled;
    if (CHAPTER_LABELS.has(label.toLowerCase()) && parseNumeral(numeral) === target) {
      return rest.trim() || raw;
    }
  }

  // "4. Memory", "4 – Memory" (bare numeric prefix)
  const bare = raw.match(/^(\d+)\s*[.:)\-–—]\s+(.+)$/);
  if (bare) {
    const [, numeral, rest] = bare;
    if (parseInt(numeral, 10) === target) return rest.trim() || raw;
  }

  return raw;
}
