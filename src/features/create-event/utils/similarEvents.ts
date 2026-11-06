// Links can't catch one event listed on two platforms, so we compare what stays the same: city, date and title.
// This only ever warns. Two real events can share a day and a name, and an admin makes the final call.

// A city, year or edition number says nothing about which event it is: "AI Summit Goa 2.0" and "AI Summit" match.
const IGNORED_TITLE_WORDS = new Set(["a", "an", "the", "of", "for", "in", "at", "and", "on", "by", "with"]);
const NUMBER_PATTERN = /^\d+$/;
const SIMILAR_TITLE_THRESHOLD = 0.6;

function titleWords(title: string, city: string | null | undefined) {
  const cityWords = new Set(normalizeWords(city || ""));
  const words = normalizeWords(title).filter(
    (word) => !IGNORED_TITLE_WORDS.has(word) && !NUMBER_PATTERN.test(word) && !cityWords.has(word)
  );
  return new Set(words);
}

function normalizeWords(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);
}

export function isSimilarTitle(first: string, second: string, city?: string | null) {
  const a = titleWords(first, city);
  const b = titleWords(second, city);
  if (a.size === 0 || b.size === 0) return false;
  const shared = [...a].filter((word) => b.has(word)).length;
  const total = new Set([...a, ...b]).size;
  return shared / total >= SIMILAR_TITLE_THRESHOLD;
}

export type SimilarEventCandidate = {
  id: string;
  slug: string | null;
  title: string;
  city: string | null;
  date_string: string | null;
};

export function isSameCity(first: string | null | undefined, second: string | null | undefined) {
  return (first || "").trim().toLowerCase() === (second || "").trim().toLowerCase();
}

export function findSimilarEvent<T extends SimilarEventCandidate>(
  event: { id?: string; title: string; city: string | null; date_string: string | null },
  candidates: T[]
) {
  return candidates.find(
    (candidate) =>
      candidate.id !== event.id &&
      candidate.date_string === event.date_string &&
      isSameCity(candidate.city, event.city) &&
      isSimilarTitle(event.title, candidate.title, event.city)
  ) ?? null;
}
