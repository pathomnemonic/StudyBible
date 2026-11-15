import { BOOK_BY_ID } from './canon';
import type { Ref } from './refs';
import type { Scheme } from './types';
import { chapterAlignmentNote, bookAlignmentNote, convertRef, fromAnchor, nativeChaptersFor } from './versification';

/**
 * Checking a passage against a real edition, and carrying it between numbering schemes without ever
 * quietly substituting a neighbouring verse. Free of app imports (no Dexie, no fetch) so scripts and tests use it too.
 */

/** The part of an edition record the checks need: which books/chapters exist and how many verses each chapter has. */
export interface CountsEdition {
  id: string;
  scheme: Scheme | string;
  chapters: Record<string, number>;
  verseCounts: Record<string, number[]>;
}

export interface RefIssue {
  /** `absent`: the edition does not contain the book. `invalid`: the book is there but the chapter or verse is not. */
  kind: 'absent' | 'invalid';
  /** which part failed: the book, a chapter, or a verse number (a verse past the end of a real chapter) */
  scope: 'book' | 'chapter' | 'verse';
  reason: string;
}

/**
 * The verse counts of every edition that shares one numbering scheme, taking the largest count for each chapter:
 * editions of the same tradition do not always agree (a merged or split verse), and a passage that exists in any of them
 * is a real passage of that tradition. Used to check a typed reference, never to decide how a reader displays it.
 */
export function pooledCounts(editions: CountsEdition[], scheme: string): CountsEdition | null {
  const same = editions.filter((e) => e.scheme === scheme);
  if (!same.length) return null;
  const chapters: Record<string, number> = {};
  const verseCounts: Record<string, number[]> = {};
  for (const e of same) {
    for (const [b, n] of Object.entries(e.chapters)) chapters[b] = Math.max(chapters[b] ?? 0, n);
    for (const [b, arr] of Object.entries(e.verseCounts ?? {})) {
      const cur = (verseCounts[b] ??= []);
      arr.forEach((n, i) => { cur[i] = Math.max(cur[i] ?? 0, n); });
    }
  }
  return { id: same.map((e) => e.id).join('+'), scheme, chapters, verseCounts };
}

const nameOf = (book: string) => BOOK_BY_ID[book]?.name ?? book;

/**
 * Is every part of this passage a real place in this edition's own numbering? Both ends are checked, so a range
 * that starts inside a chapter and runs past its end, or into a chapter that does not exist, is reported.
 * A verse number is only checked when the edition carries verse counts for that chapter; if it does not, the
 * answer is `invalid` (we cannot confirm it) rather than a silent pass.
 */
export function checkRefIn(ed: CountsEdition, ref: Ref): RefIssue | null {
  const name = nameOf(ref.book);
  if (!BOOK_BY_ID[ref.book]) return { kind: 'invalid', scope: 'book', reason: `unknown book ${ref.book}` };
  const nCh = ed.chapters[ref.book];
  if (!nCh) return { kind: 'absent', scope: 'book', reason: `${name} is not in this edition (${ed.id})` };
  if (!Number.isInteger(ref.c1) || !Number.isInteger(ref.c2) || ref.c1 < 1 || ref.c2 < ref.c1)
    return { kind: 'invalid', scope: 'chapter', reason: `${name} ${ref.c1}${ref.c2 !== ref.c1 ? '–' + ref.c2 : ''} is not a valid chapter range` };
  if (ref.c2 > nCh) return { kind: 'invalid', scope: 'chapter', reason: `${name} has ${nCh} chapter${nCh === 1 ? '' : 's'} in ${ed.id}; chapter ${ref.c2} does not exist` };
  const counts = ed.verseCounts?.[ref.book];
  const end = (c: number) => counts?.[c - 1];
  const check = (c: number, v: number | undefined): RefIssue | null => {
    if (v === undefined) return null;
    const n = end(c);
    if (!n) return { kind: 'invalid', scope: 'verse', reason: `${ed.id} has no verse count for ${name} ${c}, so verse ${v} cannot be confirmed` };
    if (!Number.isInteger(v) || v < 1) return { kind: 'invalid', scope: 'verse', reason: `${name} ${c}:${v} is not a valid verse` };
    if (v > n) return { kind: 'invalid', scope: 'verse', reason: `${name} ${c} has ${n} verse${n === 1 ? '' : 's'} in ${ed.id}; verse ${v} does not exist` };
    return null;
  };
  const a = check(ref.c1, ref.v1);
  if (a) return a;
  const b = check(ref.c2, ref.v2);
  if (b) return b;
  if (ref.c1 === ref.c2 && ref.v1 !== undefined && ref.v2 !== undefined && ref.v2 < ref.v1)
    return { kind: 'invalid', scope: 'verse', reason: `${name} ${ref.c1}:${ref.v1}–${ref.v2} runs backwards` };
  return null;
}

/** Where the passage lands in a target edition. `exact` only when every step of the mapping is a verified one. */
export interface Resolution {
  status: 'exact' | 'approximate' | 'invalid' | 'absent';
  /** the passage as written, in `sourceScheme` numbering. Always preserved. */
  original: Ref;
  sourceScheme: Scheme;
  /** the same passage in the app's anchor (Vulgate) numbering, as far as the mapping goes. */
  anchor?: Ref;
  /** the passage in the target edition's own numbering (for `approximate`, a best guess the caller must label as one). */
  native?: Ref;
  /** why the passage is not an exact match, or why it could not be placed. */
  reason?: string;
}

/** Native passage in `ed`'s own numbering for an anchor passage; both endpoints, cross-chapter ranges included. */
export function anchorToNativeRef(ed: CountsEdition, anchor: Ref): { ref: Ref; exact: boolean; note?: string } {
  const s = ed.scheme as Scheme;
  // Use the shared range-aware converter: checking only the two verse endpoints misses an
  // unverified chapter between them (for example Genesis 48:31–51:1 across chapters 49–50).
  const mapped = convertRef('vulgate', s, anchor);
  const note = mapped.exact ? undefined
    : bookAlignmentNote(s, anchor.book)
      ?? chapterAlignmentNote(s, anchor.book, anchor.c1)
      ?? chapterAlignmentNote(s, anchor.book, anchor.c2)
      ?? 'This passage crosses a chapter whose verse alignment is not verified in this edition.';
  return { ref: mapped.ref, exact: mapped.exact, note };
}
/**
 * Take a passage typed in one numbering (a lesson's English numbering, `kjv`) and place it in a target edition.
 * `source` holds the verse counts of that numbering and decides whether the passage exists at all. Nothing nearby is
 * substituted: a passage that does not exist is `invalid`, a book the target lacks is `absent`, and a mapping that is not
 * verified is `approximate`, never `exact`. A verse past the end of a chapter whose numbering is known to differ between
 * traditions (2 Maccabees 12:46) is `approximate` when the Vulgate-numbered edition `anchor` does contain it, and the
 * result then points at the chapter rather than at a verse the target edition may not have.
 */
export function resolveRef(source: CountsEdition, target: CountsEdition, ref: Ref, sourceScheme: Scheme = 'kjv', anchorEd?: CountsEdition | null): Resolution {
  const base = { original: ref, sourceScheme };
  const conv = convertRef(sourceScheme, 'vulgate', ref);
  let anchor = conv.ref;
  let numbering: string | undefined;
  const bad = checkRefIn(source, ref);
  const knownAlignment = Boolean(chapterAlignmentNote(sourceScheme, ref.book, ref.c1) || chapterAlignmentNote(sourceScheme, ref.book, ref.c2));
  const verseEndpoints = [{ chapter: ref.c1, verse: ref.v1 }, { chapter: ref.c2, verse: ref.v2 }].filter((x): x is { chapter: number; verse: number } => x.verse !== undefined);
  const withinOneVerseOverrun = verseEndpoints.length > 0 && verseEndpoints.every(({ chapter, verse }) => {
    const max = source.verseCounts?.[ref.book]?.[chapter - 1];
    return max !== undefined && verse >= 1 && verse <= max + 1;
  });
  if (bad) {
    const known = bad.scope === 'verse' && knownAlignment && withinOneVerseOverrun;
    if (!known || !anchorEd) return { ...base, status: bad.kind === 'absent' ? 'absent' : 'invalid', reason: bad.reason };
    const anchorIssue = checkRefIn(anchorEd, anchor);
    if (anchorIssue) {
      const chapterOnly: Ref = { book: anchor.book, c1: anchor.c1, c2: anchor.c2 };
      const chapterIssue = checkRefIn(anchorEd, chapterOnly);
      if (anchorIssue.scope !== 'verse' || chapterIssue) return { ...base, status: anchorIssue.kind === 'absent' ? 'absent' : 'invalid', anchor, reason: `canonical Vulgate anchor: ${anchorIssue.reason}` };
      anchor = chapterOnly;
      numbering = `The source and canonical verse counts differ (${bad.reason}; ${anchorIssue.reason}); only the chapter range can be verified.`;
    } else {
      numbering = `${nameOf(ref.book)} is numbered differently in different traditions: ${bad.reason}, but this passage exists in the Vulgate numbering`;
    }
  }
  // If a known one-verse numbering overrun or a static conversion points to a missing anchor verse,
  // retain only the verified chapter range as an explicit approximation.
  if (!bad && anchorEd) {
    const anchorIssue = checkRefIn(anchorEd, anchor);
    if (anchorIssue) {
      const anchorEndpoints = [{ chapter: anchor.c1, verse: anchor.v1 }, { chapter: anchor.c2, verse: anchor.v2 }].filter((x): x is { chapter: number; verse: number } => x.verse !== undefined);
      const withinOneAnchorOverrun = anchorEndpoints.length > 0 && anchorEndpoints.every(({ chapter, verse }) => {
        const max = anchorEd.verseCounts?.[anchor.book]?.[chapter - 1];
        return max !== undefined && verse >= 1 && verse <= max + 1;
      });
      const known = anchorIssue.scope === 'verse' && knownAlignment && withinOneAnchorOverrun;
      const chapterOnly: Ref = { book: anchor.book, c1: anchor.c1, c2: anchor.c2 };
      const chapterIssue = checkRefIn(anchorEd, chapterOnly);
      if (!known || chapterIssue) return { ...base, status: anchorIssue.kind === 'absent' ? 'absent' : 'invalid', anchor, reason: `canonical Vulgate anchor: ${anchorIssue.reason}` };
      anchor = chapterOnly;
      numbering = `The verse endpoint is not present at that address in the canonical Vulgate edition (${anchorIssue.reason}); only the chapter range can be verified.`;
    }
  }
  // A passage typed in the English tradition, opened in an edition numbered in that same tradition, needs no conversion:
  // the numbers mean the same thing on both sides (Daniel 3 and 4 are the one place the two traditions' rules differ).
  const sameTradition = (target.scheme === sourceScheme || (sourceScheme === 'kjv' && target.scheme === 'english')) &&
    !bookAlignmentNote(sourceScheme, ref.book) && !bookAlignmentNote(target.scheme as Scheme, ref.book);
  const t = sameTradition ? { ref, exact: true, note: undefined } : anchorToNativeRef(target, anchor);
  const issue = checkRefIn(target, t.ref);
  if (issue) {
    if (issue.kind === 'absent') return { ...base, status: 'absent', anchor, reason: issue.reason };
    const targetScheme = target.scheme as Scheme;
    const targetKnown = Boolean(
      chapterAlignmentNote(targetScheme, t.ref.book, t.ref.c1) ||
      chapterAlignmentNote(targetScheme, t.ref.book, t.ref.c2) ||
      chapterAlignmentNote(sourceScheme, ref.book, ref.c1) ||
      chapterAlignmentNote(sourceScheme, ref.book, ref.c2)
    );
    const endpoints = [{ chapter: t.ref.c1, verse: t.ref.v1 }, { chapter: t.ref.c2, verse: t.ref.v2 }]
      .filter((x): x is { chapter: number; verse: number } => x.verse !== undefined);
    const withinOneTargetOverrun = endpoints.length > 0 && endpoints.every(({ chapter, verse }) => {
      const max = target.verseCounts?.[t.ref.book]?.[chapter - 1];
      return max !== undefined && verse >= 1 && verse <= max + 1;
    });
    const chapterOnly: Ref = { book: t.ref.book, c1: t.ref.c1, c2: t.ref.c2 };
    const chapterIssue = checkRefIn(target, chapterOnly);
    if (issue.scope !== 'verse' || !targetKnown || !withinOneTargetOverrun || chapterIssue)
      return { ...base, status: 'invalid', anchor, reason: issue.reason };
    return { ...base, status: 'approximate', anchor, native: chapterOnly, reason: `${numbering ?? issue.reason}; only the verified chapter range is available in ${target.id}, so no verse is selected` };
  }
  // When both source and target use the same numbering tradition, the native target address can be exact even if its optional Vulgate anchor is not. Keep that distinction for reader links; anchor consumers still check conversion exactness separately.
  if (sameTradition && !bad) return { ...base, status: 'exact', anchor, native: t.ref };
  if (numbering || (!sameTradition && (!conv.exact || !t.exact))) {
    return { ...base, status: 'approximate', anchor, native: t.ref, reason: numbering ?? t.note ?? 'The verse numbering of this passage differs between editions, so the matching verses may be off by one or two.' };
  }
  return { ...base, status: 'exact', anchor, native: t.ref };
}

/** Reader URL for a native passage, or null when the edition does not have that chapter. No chapter is ever clamped. */
export function readerUrl(ed: CountsEdition, native: Ref, parallel?: string | null): string | null {
  // This is the final boundary before a generated link leaves the resolver: reject invalid
  // end chapters and verse endpoints here too, even if a caller forgot to validate upstream.
  if (checkRefIn(ed, native)) return null;
  const v = native.v1 ? `v=${native.v1}${native.c2 === native.c1 && native.v2 && native.v2 !== native.v1 ? '-' + native.v2 : ''}` : '';
  const q = [parallel ? `p=${parallel}` : '', v].filter(Boolean).join('&');
  return `/read/${ed.id}/${native.book}/${native.c1}${q ? '?' + q : ''}`;
}
