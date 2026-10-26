import { lookupBook, parseRefs, type Ref } from './refs';

export type Piece = string | { text: string; ref: Ref };

// "Matt. 16:18", "1 Cor. 11:23-26", "John 6:51"; a psalm may stand with a chapter alone ("Ps. 23").
const RE = /\b((?:[1-3]\s?)?[A-Z][a-z]{1,10})\.?\s(\d{1,3})(?::(\d{1,3})(?:[-–](\d{1,3}))?)?/g;

/** Cut a paragraph into plain text and the scripture references inside it, so each reference can be a link. */
export function splitScripture(text: string): Piece[] {
  const out: Piece[] = [];
  let pos = 0;
  for (const m of text.matchAll(RE)) {
    const book = lookupBook(m[1]);
    if (!book || (m[3] === undefined && book !== 'PSA')) continue;
    const tail = m[3] === undefined ? m[2] : `${m[2]}:${m[3]}${m[4] ? '-' + m[4] : ''}`;
    const r = parseRefs(`${m[1]} ${tail}`);
    if (!r.ok || r.refs.length !== 1) continue;
    const at = m.index ?? 0;
    if (at > pos) out.push(text.slice(pos, at));
    out.push({ text: m[0], ref: r.refs[0].ref });
    pos = at + m[0].length;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}
