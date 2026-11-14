/**
 * What happens when two devices changed the same note or journal entry before either synced.
 *
 * The record-level rule stays "the newer edit wins". On top of that, nothing the other device wrote is thrown away silently:
 *  - tags and references are joined (a union, in a stable order), a pin stays pinned, an answered intention stays answered;
 *  - if the text differs, or any other field (title, kind, folder, targets, revisit date, date, ...) differs and cannot be joined,
 *    the older version is kept as a separate copy. The copy's id is derived from the record and from what it contains, so syncing
 *    again (or syncing on a third device) finds it instead of making another one.
 */
export type Row = Record<string, any>;

/** fields that never count as a difference: identity, bookkeeping and values derived from others */
const IGNORED = new Set(['id', 'uid', 'updatedAt', 'createdAt', 'history', 'chapterKeys']);

/** fields where both devices' values can simply be joined */
const UNION = new Set(['tags', 'refs']);
const OR = new Set(['pinned', 'answered']);

import { canonical } from '../lib/canonical';
export { canonical };
const norm = canonical;

/** a stable 53-bit hash of text (cyrb53), written in base 36: wide enough that different conflicts do not collide in practice */
export function hash(s: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** the same record and the same lost values always give the same id, on any device and on every sync */
export const conflictUid = (uid: string, differing: Row) => `${uid}~conflict~${hash(canonical(differing))}`;

export interface Resolution {
  /** the record that replaces the local one */
  merged: Row;
  /** the older version kept as its own record, when something would otherwise be lost */
  copy: Row | null;
  /** which fields differed (for tests and the status line) */
  differing: string[];
}

export function resolveConflict(table: 'notes' | 'journal' | string, local: Row, remote: Row, now = Date.now()): Resolution {
  const keys = [...new Set([...Object.keys(local), ...Object.keys(remote)])].filter((k) => !IGNORED.has(k));
  const differing = keys.filter((k) => norm(local[k]) !== norm(remote[k]));
  const merged: Row = { ...remote };
  const lost: Row = {};
  for (const k of differing) {
    if (UNION.has(k)) {
      const a: unknown[] = Array.isArray(local[k]) ? local[k] : [];
      const b: unknown[] = Array.isArray(remote[k]) ? remote[k] : [];
      merged[k] = [...new Set([...b, ...a].map((x) => JSON.stringify(x)))].map((x) => JSON.parse(x));
    } else if (OR.has(k)) {
      merged[k] = !!local[k] || !!remote[k];
    } else {
      lost[k] = local[k] ?? null;
    }
  }
  if (!Object.keys(lost).length || (table !== 'notes' && table !== 'journal')) return { merged, copy: null, differing };
  const { id: _id, uid, ...rest } = local;
  const copy: Row = { ...rest, uid: conflictUid(String(uid), lost), updatedAt: now };
  if (table === 'notes') copy.title = `${local.title || 'Note'} (other version kept at sync)`;
  else copy.body = `(Other version kept at sync)\n\n${local.body ?? ''}`;
  // the copy is a plain note of its own: it is not pinned and does not claim the original's place in a folder
  delete copy.pinned;
  return { merged, copy, differing };
}

/** does a record hold anything worth keeping if the other device deleted it? (text, a title, tags, targets) */
export function hasContent(r: Row): boolean {
  return !!(String(r.body ?? '').trim() || String(r.title ?? '').trim() || (r.tags && r.tags.length) || (r.targets && r.targets.length) || (r.refs && r.refs.length));
}
