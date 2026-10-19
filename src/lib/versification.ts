/**
 * Versification: translating between an edition's native chapter/verse numbers and the
 * app's stable *anchor* numbering (the Clementine Vulgate, as used by the Douay-Rheims).
 *
 * Why an anchor? Notes, highlights, cross-references, commentary and episode mappings must
 * survive a change of translation. Each of them is stored against an anchor verse id such as
 * `PSA.22.1`. An edition declares which numbering `scheme` it uses; the rules below describe how
 * that scheme departs from the anchor. Everything not covered by a rule is the identity mapping,
 * and chapters known to differ without a verified rule are reported as `exact: false` so the UI
 * can say so instead of silently pointing at the wrong verse.
 */
import type { Ref } from './refs';
import type { Scheme } from './types';

/** [book, nativeChapter, nativeV1, nativeV2, anchorChapter, anchorV1, anchorV2] */
export type Rule = [string, number, number, number, number, number, number];

export interface VersificationData {
  version: number;
  schemes: Record<
    string,
    {
      description: string;
      rules: Rule[];
      /** book → list of native chapters whose numbering is known to differ with no verified rule. */
      unverifiedChapters: Record<string, number[]>;
      /** book → reason the whole book cannot be aligned verse-by-verse. */
      unalignedBooks: Record<string, string>;
    }
  >;
}

export interface MapResult {
  c: number;
  v1: number;
  v2: number;
  /** true when the mapping comes from a verified rule or a verified identity. */
  exact: boolean;
  /** Human-readable caveat when exact is false. */
  note?: string;
}

interface Index {
  native: Map<string, Rule[]>; // key "BOOK.c"
  anchor: Map<string, Rule[]>; // key "BOOK.c"
  unverified: Map<string, Set<number>>;
  unaligned: Record<string, string>;
}

const indexes = new Map<string, Index>();

export function loadVersification(data: VersificationData) {
  indexes.clear();
  for (const [scheme, s] of Object.entries(data.schemes)) {
    const idx: Index = { native: new Map(), anchor: new Map(), unverified: new Map(), unaligned: s.unalignedBooks };
    for (const r of s.rules) {
      const nk = `${r[0]}.${r[1]}`;
      const ak = `${r[0]}.${r[4]}`;
      (idx.native.get(nk) ?? idx.native.set(nk, []).get(nk)!).push(r);
      (idx.anchor.get(ak) ?? idx.anchor.set(ak, []).get(ak)!).push(r);
    }
    for (const [b, chs] of Object.entries(s.unverifiedChapters)) idx.unverified.set(b, new Set(chs));
    indexes.set(scheme, idx);
  }
}

export function isLoaded() {
  return indexes.size > 0;
}

const identity = (c: number, v: number, exact = true, note?: string): MapResult => ({ c, v1: v, v2: v, exact, note });

function caveat(idx: Index | undefined, book: string, nativeChapter: number): string | undefined {
  if (!idx) return undefined;
  if (idx.unaligned[book]) return idx.unaligned[book];
  if (idx.unverified.get(book)?.has(nativeChapter))
    return 'Verse numbering in this chapter differs between editions; the matching verse may be off by one or two.';
  return undefined;
}

/** Native (edition) verse → anchor verse(s). */
export function toAnchor(scheme: Scheme, book: string, c: number, v: number): MapResult {
  if (scheme === 'vulgate') return identity(c, v);
  const idx = indexes.get(scheme);
  const rules = idx?.native.get(`${book}.${c}`);
  if (rules) {
    for (const r of rules) {
      if (v >= r[2] && v <= r[3]) {
        const len = r[6] - r[5];
        const nlen = r[3] - r[2];
        const note = caveat(idx, book, c);
        if (len === nlen) return { c: r[4], v1: r[5] + (v - r[2]), v2: r[5] + (v - r[2]), exact: !note, note };
        return { c: r[4], v1: r[5], v2: r[6], exact: false, note: note ?? 'This verse corresponds to a group of verses in the other numbering.' };
      }
    }
    return identity(c, v, false, 'Outside the verified mapping for this chapter.');
  }
  const note = caveat(idx, book, c);
  return identity(c, v, !note, note);
}

/** Anchor verse → native (edition) verse(s). */
export function fromAnchor(scheme: Scheme, book: string, c: number, v: number): MapResult {
  if (scheme === 'vulgate') return identity(c, v);
  const idx = indexes.get(scheme);
  const rules = idx?.anchor.get(`${book}.${c}`);
  if (rules) {
    for (const r of rules) {
      if (v >= r[5] && v <= r[6]) {
        const len = r[6] - r[5];
        const nlen = r[3] - r[2];
        const note = caveat(idx, book, r[1]);
        if (len === nlen) return { c: r[1], v1: r[2] + (v - r[5]), v2: r[2] + (v - r[5]), exact: !note, note };
        return { c: r[1], v1: r[2], v2: r[3], exact: false, note: note ?? 'This verse corresponds to a group of verses in the other numbering.' };
      }
    }
    // Verse beyond the verified range of the rule(s): point at the last verse of the closest rule, flagged.
    const last = rules[rules.length - 1];
    return { c: last[1], v1: last[3], v2: last[3], exact: false, note: 'Beyond the verified verse mapping for this chapter.' };
  }
  const note = caveat(idx, book, c);
  return identity(c, v, !note, note);
}

/** Which native chapter(s) does an anchor chapter live in (usually one)? */
export function nativeChaptersFor(scheme: Scheme, book: string, anchorChapter: number): number[] {
  if (scheme === 'vulgate') return [anchorChapter];
  const rules = indexes.get(scheme)?.anchor.get(`${book}.${anchorChapter}`);
  if (!rules) return [anchorChapter];
  return [...new Set(rules.map((r) => r[1]))].sort((a, b) => a - b);
}

/** Which anchor chapter(s) does a native chapter map to? */
export function anchorChaptersFor(scheme: Scheme, book: string, nativeChapter: number): number[] {
  if (scheme === 'vulgate') return [nativeChapter];
  const rules = indexes.get(scheme)?.native.get(`${book}.${nativeChapter}`);
  if (!rules) return [nativeChapter];
  return [...new Set(rules.map((r) => r[4]))].sort((a, b) => a - b);
}

export function bookAlignmentNote(scheme: Scheme, book: string): string | undefined {
  return indexes.get(scheme)?.unaligned[book];
}

export function chapterAlignmentNote(scheme: Scheme, book: string, nativeChapter: number): string | undefined {
  return caveat(indexes.get(scheme), book, nativeChapter);
}

/** Convert a whole passage between numbering schemes. The result may be wider than the input. */
export function convertRef(from: Scheme, to: Scheme, r: Ref): { ref: Ref; exact: boolean } {
  if (from === to) return { ref: r, exact: true };
  const start = from === 'vulgate' ? fromAnchor(to, r.book, r.c1, r.v1 ?? 1) : toAnchor(from, r.book, r.c1, r.v1 ?? 1);
  const end =
    r.v2 === undefined
      ? undefined
      : from === 'vulgate'
        ? fromAnchor(to, r.book, r.c2, r.v2)
        : toAnchor(from, r.book, r.c2, r.v2);
  return {
    ref: {
      book: r.book,
      c1: start.c,
      v1: r.v1 === undefined ? undefined : start.v1,
      c2: end ? end.c : start.c,
      v2: end ? end.v2 : r.v1 === undefined ? undefined : start.v2,
    },
    exact: start.exact && (end ? end.exact : true),
  };
}

/** The English-tradition number for a Vulgate psalm chapter, e.g. 22 → "23". Used for dual labelling. */
export function psalmEnglishNumber(vulgateChapter: number, verse?: number): number {
  const c = vulgateChapter;
  if (c <= 8) return c;
  if (c === 9) return verse !== undefined && verse >= 22 ? 10 : 9;
  if (c >= 10 && c <= 112) return c + 1;
  if (c === 113) return verse !== undefined && verse >= 9 ? 115 : 114;
  if (c === 114 || c === 115) return 116;
  if (c >= 116 && c <= 145) return c + 1;
  if (c === 146 || c === 147) return 147;
  return c;
}

/** Vulgate → English label for psalms ("Ps 22" → "Ps 22 (23)"), or '' for books where it does not apply. */
export function psalmDualLabel(vulgateChapter: number): string {
  const e = psalmEnglishNumber(vulgateChapter);
  const spans: Record<number, string> = { 9: '9–10', 113: '114–115', 114: '116:1–9', 115: '116:10–19', 146: '147:1–11', 147: '147:12–20' };
  const label = spans[vulgateChapter] ?? String(e);
  return label === String(vulgateChapter) ? '' : label;
}

/**
 * Anchor refs covering a *whole native chapter* (e.g. English Ps 10 → Vulgate Ps 9:22–39,
 * English Ps 116 → Vulgate Ps 114 + 115). Used for plans/episodes that list chapters in modern numbering.
 */
export function chapterToAnchorRefs(scheme: Scheme, book: string, nativeChapter: number): { ref: Ref; exact: boolean }[] {
  if (scheme === 'vulgate') return [{ ref: { book, c1: nativeChapter, c2: nativeChapter }, exact: true }];
  const idx = indexes.get(scheme);
  const rules = idx?.native.get(`${book}.${nativeChapter}`);
  const note = caveat(idx, book, nativeChapter);
  if (!rules) return [{ ref: { book, c1: nativeChapter, c2: nativeChapter }, exact: !note }];
  const by = new Map<number, [number, number]>();
  for (const r of rules) {
    const cur = by.get(r[4]);
    by.set(r[4], cur ? [Math.min(cur[0], r[5]), Math.max(cur[1], r[6])] : [r[5], r[6]]);
  }
  // A native chapter is a *whole* anchor chapter only when no other native chapter shares that anchor chapter.
  const whole = (c: number, [a, b]: [number, number]): Ref => {
    const shared = (idx?.anchor.get(`${book}.${c}`) ?? []).some((r) => r[1] !== nativeChapter);
    return shared ? { book, c1: c, v1: a, c2: c, v2: b } : { book, c1: c, c2: c };
  };
  return [...by.entries()].sort((x, y) => x[0] - y[0]).map(([c, range]) => ({ ref: whole(c, range), exact: !note }));
}
