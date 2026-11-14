import type { EditionRecord } from '../data/loader';
import { anchorToNative } from './bibleText';
import type { Ref } from './refs';

/** Route that opens an anchor passage in the reader, in the given edition's own numbering. */
export function readerPath(edition: EditionRecord, ref: Ref, parallel?: string | null): string {
  const n = anchorToNative(edition, ref);
  // The chapter is passed through as the mapping gives it; a chapter the edition lacks is the reader's "not found", never a nearby chapter.
  const ch = Math.max(1, n.chapter);
  const v = n.v1 ? `v=${n.v1}${n.v2 && n.v2 !== n.v1 ? '-' + n.v2 : ''}` : '';
  const p = parallel ? `p=${parallel}` : '';
  const q = [p, v].filter(Boolean).join('&');
  return `/read/${edition.id}/${ref.book}/${ch}${q ? '?' + q : ''}`;
}
