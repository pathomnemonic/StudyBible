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

const norm = (v: unknown): string => JSON.stringify(v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || v === false ? null : v);

/** a short stable hash of text (FNV-1a), for conflict ids */
export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

export const conflictUid = (uid: string, differing: Row) => `${uid}~conflict~${hash(JSON.stringify(differing, Object.keys(differing).sort()))}`;

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
