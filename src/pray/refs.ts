import { convertRef } from '../lib/versification';
import { parseRefs, type Ref } from '../lib/refs';

/** Scripture references in a devotion are written in KJV numbering; the reader's own editions use the Vulgate numbering for the Psalms. */
export const toRefs = (s: string): Ref[] => {
  const p = parseRefs(s);
  return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : [];
};
