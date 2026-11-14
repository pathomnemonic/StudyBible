/**
 * Repairs for the problems the data check finds, only where the fix is certain: a passage address that is the same passage written another way
 * (lower case, an en dash, spaces) or written the way a person types it ("Jn 6:51-58", an old book alias). Nothing here runs by itself:
 * the reader presses a button, a safety copy is kept first, and the exact old values are kept so the change can be undone.
 */
import { sameValue } from './canonical';
import { parseRefId, parseRefs, refId } from './refs';
import { convertRef } from './versification';
import type { Target } from '../db/db';
import type { HealthInput } from './dataHealth';

/** the passage ids an unreadable address stands for, or null when it cannot be known for certain */
export function repairPassageId(s: string): string[] | null {
  if (parseRefId(s)) return null; // already fine
  const tidy = s.trim().replace(/[–—]/g, '-').replace(/\s+/g, '').toUpperCase();
  if (tidy && parseRefId(tidy)) return [tidy];
  const p = parseRefs(s);
  if (p.ok && p.refs.length) return p.refs.map((x) => refId(convertRef('kjv', 'vulgate', x.ref).ref));
  return null;
}

export type RepairTable = 'notes' | 'highlights' | 'bookmarks' | 'collections' | 'userPlans';
export interface Repair {
  key: string;
  tbl: RepairTable;
  id: number;
  where: string;
  /** one line for each address that is put right */
  changes: string[];
  patch: Record<string, unknown>;
  before: Record<string, unknown>;
}
export interface RepairInput extends Omit<HealthInput, 'highlights' | 'bookmarks'> {
  highlights: { id?: number; ref?: string }[];
  bookmarks: { id?: number; ref?: string }[];
}

const pick = (row: object, keys: string[]) => Object.fromEntries(keys.map((k) => [k, (row as Record<string, unknown>)[k]]));

export function planRepairs(d: RepairInput, chapterKeysOf: (t: Target[]) => string[] = () => []): Repair[] {
  const out: Repair[] = [];
  for (const n of d.notes) {
    if (n.id == null) continue;
    const changes: string[] = [];
    const targets = n.targets.flatMap((t): Target[] => {
      if (t.type !== 'passage') return [t];
      const fix = repairPassageId(t.ref);
      if (!fix) return [t];
      changes.push(`${t.ref} becomes ${fix.join(', ')}`);
      return fix.map((ref) => ({ ...t, ref }));
    });
    if (changes.length) out.push({ key: `notes:${n.id}`, tbl: 'notes', id: n.id, where: `Note “${n.title || n.body.split('\n')[0].slice(0, 40) || 'A note'}”`, changes, patch: { targets, chapterKeys: chapterKeysOf(targets) }, before: pick(n, ['targets', 'chapterKeys']) });
  }
  for (const [tbl, rows, label] of [['highlights', d.highlights, 'A highlight'], ['bookmarks', d.bookmarks, 'A bookmark']] as const) {
    for (const r of rows) {
      if (r.id == null || !r.ref) continue;
      const fix = repairPassageId(r.ref);
      if (!fix || fix.length !== 1) continue; // one record cannot become several
      const ref = parseRefId(fix[0])!;
      out.push({ key: `${tbl}:${r.id}`, tbl, id: r.id, where: label, changes: [`${r.ref} becomes ${fix[0]}`], patch: tbl === 'highlights' ? { ref: fix[0], book: ref.book, c: ref.c1 } : { ref: fix[0] }, before: tbl === 'highlights' ? pick(r, ['ref', 'book', 'c']) : pick(r, ['ref']) });
    }
  }
  for (const c of d.collections) {
    if (c.id == null) continue;
    const changes: string[] = [];
    const items: Target[] = [];
    const fixed: Target[] = [];
    for (const t of c.items) {
      const fix = t.type === 'passage' ? repairPassageId(t.ref) : null;
      if (!fix || t.type !== 'passage') { items.push(t); continue; }
      changes.push(`${t.ref} becomes ${fix.join(', ')}`);
      for (const ref of fix) { const nt: Target = { ...t, ref }; fixed.push(nt); items.push(nt); }
    }
    // a repaired item that is now the same as another item is kept once (items that were doubled before the repair are left as they were)
    const seen: Target[] = [];
    const kept = items.filter((x) => { if (!fixed.some((f) => sameValue(f, x))) return true; if (seen.some((y) => sameValue(y, x))) return false; seen.push(x); return true; });
    items.length = 0; items.push(...kept);
    if (changes.length) out.push({ key: `collections:${c.id}`, tbl: 'collections', id: c.id, where: `Collection “${c.name}”`, changes, patch: { items }, before: pick(c, ['items']) });
  }
  for (const p of d.userPlans) {
    if (p.id == null) continue;
    const changes: string[] = [];
    const days = p.days.map((day) => ({ ...day, refs: day.refs.flatMap((r) => { const fix = repairPassageId(r); if (!fix) return [r]; changes.push(`${r} becomes ${fix.join(', ')}`); return fix; }) }));
    if (changes.length) out.push({ key: `userPlans:${p.id}`, tbl: 'userPlans', id: p.id, where: `Reading plan “${p.name}”`, changes, patch: { days }, before: pick(p, ['days']) });
  }
  return out;
}

/** collection items whose note, highlight or bookmark is gone from the library but still in Recently deleted */
export function restorableItems(collections: { id?: number; name: string; items: Target[] }[], trash: { id?: number; tbl: string; data: { uid?: string } }[]): { collection: string; collectionId?: number; what: string; trashId: number }[] {
  const out: { collection: string; collectionId?: number; what: string; trashId: number }[] = [];
  const tbl = { note: 'notes', highlight: 'highlights', bookmark: 'bookmarks' } as const;
  for (const c of collections) for (const t of c.items) {
    if (t.type !== 'note' && t.type !== 'highlight' && t.type !== 'bookmark') continue;
    const row = trash.find((r) => r.tbl === tbl[t.type] && r.data.uid === t.uid);
    if (row?.id != null && !out.some((o) => o.trashId === row.id)) out.push({ collection: c.name, collectionId: c.id, what: t.label ?? `a ${t.type}`, trashId: row.id });
  }
  return out;
}

export interface UndoRecord { tbl: RepairTable; id: number; before: Record<string, unknown> }

/** Applies the repairs the reader chose. A safety copy is kept first; the returned record is what undoRepairs needs. */
export async function applyRepairs(repairs: Repair[]): Promise<UndoRecord[]> {
  const { db } = await import('../db/db');
  await import('./safety').then((m) => m.snapshotIfDue(true)).catch(() => undefined);
  const undo: UndoRecord[] = [];
  for (const r of repairs) {
    await db.table(r.tbl).update(r.id, r.patch);
    undo.push({ tbl: r.tbl, id: r.id, before: r.before });
  }
  return undo;
}

export async function undoRepairs(undo: UndoRecord[]): Promise<void> {
  const { db } = await import('../db/db');
  for (const u of undo) await db.table(u.tbl).update(u.id, u.before);
}
