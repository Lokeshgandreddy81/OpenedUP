import type { ChapterPageImage, ChapterSource, ChapterSourcePage } from "./chapterSource";

export interface RetrievedChapterPassage extends ChapterSourcePage {
  score: number;
}

export interface ChapterEvidence {
  id: string;
  pageNumber: number;
  text: string;
}

export function prepareChapterEvidence(
  passages: RetrievedChapterPassage[],
  images: ChapterPageImage[] = [],
  maxPages = 8
): { evidence: ChapterEvidence[]; images: ChapterPageImage[] } {
  if (images.length === 0) {
    return {
      evidence: passages.slice(0, maxPages).map(({ id, pageNumber, text }) => ({
        id,
        pageNumber,
        text: text.slice(0, 8_000),
      })),
      images: [],
    };
  }

  const evidenceByPage = new Map<number, ChapterEvidence>();
  for (const passage of passages) {
    if (evidenceByPage.size >= maxPages) break;
    if (!evidenceByPage.has(passage.pageNumber)) {
      evidenceByPage.set(passage.pageNumber, {
        id: passage.id,
        pageNumber: passage.pageNumber,
        text: passage.text.slice(0, 8_000),
      });
    }
  }
  for (const image of images) {
    if (evidenceByPage.size >= maxPages) break;
    if (!evidenceByPage.has(image.pageNumber)) {
      evidenceByPage.set(image.pageNumber, {
        id: `visual:page-${image.pageNumber}`,
        pageNumber: image.pageNumber,
        text: `Visual content from PDF page ${image.pageNumber}.`,
      });
    }
  }

  const evidence = [...evidenceByPage.values()];
  const citedPages = new Set(evidence.map((item) => item.pageNumber));
  return { evidence, images: images.filter((image) => citedPages.has(image.pageNumber)) };
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "about",
  "be",
  "bullet",
  "by",
  "for",
  "from",
  "give",
  "how",
  "idea",
  "ideas",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "or",
  "one",
  "please",
  "point",
  "summarize",
  "tell",
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
  "explain",
  "chapter",
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
        const boundary = Math.max(
          page.text.lastIndexOf("\n", end),
          page.text.lastIndexOf(". ", end),
          page.text.lastIndexOf("? ", end),
          page.text.lastIndexOf("! ", end),
          page.text.lastIndexOf(" ", end)
        );
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

  const broadStudyPrompt =
    queryTerms.length === 0 ||
    /\b(summar(?:y|ize|ise)|key takeaways|takeaways|main ideas|key idea|key term|remember|overview|hello|hi|hey)\b/i.test(
      question
    );
  if (broadStudyPrompt) {
    const overview: RetrievedChapterPassage[] = [];
    const usedIds = new Set<string>();
    const pages = [...new Set(passages.map((passage) => passage.pageNumber))];
    const representativeCount = Math.min(resultLimit, pages.length);
    const representativePages =
      representativeCount <= 1
        ? pages.slice(0, representativeCount)
        : Array.from({ length: representativeCount }, (_, index) => {
            const pageIndex = Math.floor((index * (pages.length - 1)) / (representativeCount - 1));
            return pages[pageIndex];
          });

    // Spread a bounded overview across the whole chapter so later pages are
    // represented even when the chapter is longer than the evidence budget.
    for (const pageNumber of representativePages) {
      const passage = passages.find((item) => item.pageNumber === pageNumber);
      if (passage) {
        overview.push({ ...passage, score: 0 });
        usedIds.add(passage.id);
      }
    }
    for (const passage of passages) {
      if (overview.length >= resultLimit) break;
      if (usedIds.has(passage.id)) continue;
      overview.push({ ...passage, score: 0 });
    }
    return overview;
  }

  if (ranked.length === 0) {
    // Lexical search cannot recognize a paraphrase with no shared terms. Give
    // the model a bounded, page-diverse candidate set from this chapter so it
    // can judge semantic relevance instead of the UI abstaining immediately.
    const candidates: RetrievedChapterPassage[] = [];
    for (const pageNumber of [...new Set(passages.map((passage) => passage.pageNumber))]) {
      const passage = passages.find((item) => item.pageNumber === pageNumber);
      if (passage) candidates.push({ ...passage, score: 0 });
      if (candidates.length >= resultLimit) break;
    }
    return candidates;
  }

  // Never pad weak lexical matches with arbitrary chapter samples. Unrelated
  // passages make the model more likely to fabricate a grounded-sounding reply.
  const selected: RetrievedChapterPassage[] = [];
  const pageCounts = new Map<number, number>();
  for (const passage of ranked) {
    if ((pageCounts.get(passage.pageNumber) || 0) >= 2) continue;
    selected.push(passage);
    pageCounts.set(passage.pageNumber, (pageCounts.get(passage.pageNumber) || 0) + 1);
    if (selected.length >= resultLimit) break;
  }
  return selected;
}
