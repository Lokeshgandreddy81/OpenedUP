import type { ChapterSource, ChapterSourcePage } from "./chapterSource";

export interface RetrievedChapterPassage extends ChapterSourcePage {
  score: number;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
]);

function terms(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .map((term) => {
      if (term.length > 5 && term.endsWith("ies")) return `${term.slice(0, -3)}y`;
      if (term.length > 6 && term.endsWith("ing")) {
        const stem = term.slice(0, -3);
        return stem.length > 2 && stem.at(-1) === stem.at(-2) ? stem.slice(0, -1) : stem;
      }
      if (term.length > 5 && term.endsWith("ed")) return term.slice(0, -2);
      if (term.length > 4 && term.endsWith("s") && !term.endsWith("ss")) {
        return term.slice(0, -1);
      }
      return term;
    })
    .filter((term) => !STOP_WORDS.has(term));
}

/** Retrieve only page passages belonging to this selected chapter. */
export function retrieveChapterPassages(
  source: ChapterSource,
  question: string,
  limit = 8
): RetrievedChapterPassage[] {
  const queryTerms = [...new Set(terms(question))];
  if (source.pages.length === 0) return [];

  const passages = source.pages.flatMap((page) => {
    const result: ChapterSourcePage[] = [];
    const chunkSize = 1_200;
    const overlap = 180;
    let start = 0;
    while (start < page.text.length) {
      let end = Math.min(page.text.length, start + chunkSize);
      if (end < page.text.length) {
        const boundary = page.text.lastIndexOf(" ", end);
        if (boundary > start + chunkSize * 0.6) end = boundary;
      }
      const text = page.text.slice(start, end).trim();
      if (text) {
        result.push({
          id: `${page.id}:chunk-${result.length + 1}`,
          pageNumber: page.pageNumber,
          text,
        });
      }
      if (end >= page.text.length) break;
      start = Math.max(start + 1, end - overlap);
    }
    return result;
  });
  const passageTerms = passages.map((passage) => terms(passage.text));
  const averageLength =
    passageTerms.reduce((total, passage) => total + passage.length, 0) /
    Math.max(1, passageTerms.length);
  const documentFrequency = new Map<string, number>();
  for (const term of queryTerms) {
    documentFrequency.set(term, passageTerms.filter((passage) => passage.includes(term)).length);
  }

  const ranked = passages
    .map((passage, index) => {
      const contentTerms = passageTerms[index] || [];
      const counts = new Map<string, number>();
      for (const term of contentTerms) counts.set(term, (counts.get(term) || 0) + 1);
      const score = queryTerms.reduce((total, term) => {
        const frequency = counts.get(term) || 0;
        if (!frequency) return total;
        const df = documentFrequency.get(term) || 0;
        const inverseFrequency = Math.log(1 + (passages.length - df + 0.5) / (df + 0.5));
        const lengthNorm =
          (frequency * 2.2) /
          (frequency + 1.2 * (0.25 + 0.75 * (contentTerms.length / (averageLength || 1))));
        return total + inverseFrequency * lengthNorm;
      }, 0);
      return { ...passage, score };
    })
    .filter((page) => page.score > 0)
    .sort((left, right) => right.score - left.score || left.pageNumber - right.pageNumber);

  const resultLimit = Math.max(0, limit);
  if (resultLimit === 0) return [];

  // A strict keyword-only gate made ordinary paraphrases look like missing
  // chapter content. Keep the strongest lexical hits, then let the selected
  // model judge a small, evenly spread sample of the same chapter when those
  // hits are weak or absent. The model still has to cite supporting passages.
  const hasStrongMatch = ranked.length >= 2 && ranked[0]!.score >= 1.5;
  if (hasStrongMatch) {
    const selected: RetrievedChapterPassage[] = [];
    const pageCounts = new Map<number, number>();
    for (const passage of ranked) {
      if ((pageCounts.get(passage.pageNumber) || 0) >= 2) continue;
      selected.push(passage);
      pageCounts.set(passage.pageNumber, (pageCounts.get(passage.pageNumber) || 0) + 1);
      if (selected.length >= resultLimit) break;
    }
    if (selected.length < resultLimit) {
      const selectedIds = new Set(selected.map((passage) => passage.id));
      for (const passage of ranked) {
        if (selected.length >= resultLimit) break;
        if (!selectedIds.has(passage.id)) selected.push(passage);
      }
    }
    return selected;
  }

  const selected = ranked.slice(0, Math.min(2, resultLimit));
  const selectedIds = new Set(selected.map((passage) => passage.id));
  const remaining = passages.filter((passage) => !selectedIds.has(passage.id));
  const slots = resultLimit - selected.length;
  for (let index = 0; index < slots && remaining.length > 0; index += 1) {
    const sampleIndex = Math.round(((index + 1) * (remaining.length - 1)) / (slots + 1));
    const candidate = remaining[sampleIndex];
    if (candidate && !selectedIds.has(candidate.id)) {
      selected.push({ ...candidate, score: 0 });
      selectedIds.add(candidate.id);
    }
  }

  // When a chapter is too short or duplicate samples collapse, fill from the
  // beginning in document order so the API always receives usable evidence.
  for (const passage of passages) {
    if (selected.length >= resultLimit) break;
    if (!selectedIds.has(passage.id)) {
      selected.push({ ...passage, score: 0 });
      selectedIds.add(passage.id);
    }
  }
  return selected.slice(0, resultLimit);
}
