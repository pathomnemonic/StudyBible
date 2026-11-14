/** A book's word fingerprint: which words it leans on, and which it uses far more than the Bible at large does. */
const STOP = new Set(('the and of to in that he his shall for with was not they him them is it be but as on unto their by thee thou thy ye you i my me we our us have had has from at this which are were all so then there who when will said saith came out up if one into also than or her she what hath do did an no may now upon after over every come make made go let those these shalt thine your '
  + 'been would should could being am yet again before because while where how why whom whose its more most such each both any some other another many much very own same only just even back down off through about against among between without within under').split(/\s+/));

export const wordsOf = (text: string): string[] => text.toLowerCase().replace(/[’']s\b/g, '').split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));

export function countWords(texts: string[]): { counts: Map<string, number>; total: number } {
  const counts = new Map<string, number>();
  let total = 0;
  for (const t of texts) for (const w of wordsOf(t)) { counts.set(w, (counts.get(w) ?? 0) + 1); total++; }
  return { counts, total };
}

export interface Fingerprint { frequent: { word: string; n: number }[]; distinctive: { word: string; n: number; times: number }[]; total: number }

/**
 * `book` is the book's own count; `base` the count over a spread of other books. A word is distinctive when it appears at least `minCount` times
 * and its share of the book is well above its share of the base (so "faith" in Romans stands out, but "lord" in Psalms does not drown everything).
 */
export function fingerprint(book: { counts: Map<string, number>; total: number }, base: { counts: Map<string, number>; total: number }, take = 24, minCount = 5): Fingerprint {
  const frequent = [...book.counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, take).map(([word, n]) => ({ word, n }));
  const smooth = 0.5 / Math.max(1, base.total);
  const distinctive = [...book.counts]
    .filter(([, n]) => n >= minCount)
    .map(([word, n]) => ({ word, n, times: n / book.total / ((base.counts.get(word) ?? 0) / Math.max(1, base.total) + smooth) }))
    .sort((a, b) => b.times * Math.log(b.n + 1) - a.times * Math.log(a.n + 1))
    .slice(0, take);
  return { frequent, distinctive, total: book.total };
}

/** the words of a fingerprint list that contain what was typed (ignoring case); an empty search keeps everything */
export function searchWords<T extends { word: string }>(list: T[], q: string): T[] {
  const t = q.trim().toLowerCase();
  return t ? list.filter((x) => x.word.includes(t)) : list;
}

/** plain-words definitions of each measure, matching exactly what the code above computes */
export const FINGERPRINT_DEFINITIONS: { term: string; meaning: string }[] = [
  { term: 'Counted words', meaning: 'Every word of three or more letters in the chosen text, in lower case, with a trailing ’s removed, apart from a fixed list of common small words (the, and, of, he, shall, unto and similar). Each use counts once.' },
  { term: 'Most used', meaning: 'The counted words that occur most often in the chosen text, highest first. It is a plain count of exact words, so “love” and “loved” are separate.' },
  { term: 'Times more (×)', meaning: 'A word’s share of the chosen text divided by its share of a spread of other books (Genesis, Psalms, Isaiah, Matthew, John, Acts, Romans and Revelation, leaving out the book being looked at). ×5 means the word is used about five times as much, in proportion, as in that spread. A word the spread never uses is measured against a tiny stand-in share, so its number can be very large; it is shown as 100+ past 100.' },
  { term: 'What sets it apart', meaning: 'The words used at least five times in the chosen text, ranked by “times more” combined with how often they occur, so a word has to be both over-used and not rare to rank high.' },
];
