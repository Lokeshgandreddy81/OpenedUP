// Turn a raw file-ish name into a human title while preserving intentional
// casing such as AI and macOS.
export function formatDisplayTitle(raw: string): string {
  const cleaned = (raw || "")
    .split("/")
    .pop()!
    .replace(/[-_]+/g, " ")
    .replace(/^\s*\d+[.)]?\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return raw;
  const joinWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "from",
    "in",
    "into",
    "of",
    "on",
    "or",
    "the",
    "to",
    "vs",
    "with",
  ]);
  return cleaned
    .split(" ")
    .map((word, index) => {
      if (/[A-Z]/.test(word)) return word;
      const lower = word.toLowerCase();
      if (index > 0 && joinWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
