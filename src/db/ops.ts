import { db, type Bookmark, type Highlight, type HighlightColor, type Note, type Target } from './db';
import { parseRefId, refId, type Ref } from '../lib/refs';
import { BOOKS } from '../lib/canon';

export function chapterKeysOf(targets: Target[]): string[] {
  const keys = new Set<string>();
  for (const t of targets) {
    if (t.type !== 'passage') continue;
    const r = parseRefId(t.ref);
    if (!r) continue;
    for (let c = r.c1; c <= r.c2; c++) keys.add(`${r.book}.${c}`);
  }
  return [...keys];
}

export async function saveNote(n: Omit<Note, 'createdAt' | 'updatedAt' | 'chapterKeys'> & { id?: number }): Promise<number> {
  const now = Date.now();
  const rec: Note = { ...n, chapterKeys: chapterKeysOf(n.targets), createdAt: now, updatedAt: now };
  if (n.id) {
    const old = await db.notes.get(n.id);
    rec.createdAt = old?.createdAt ?? now;
    await db.notes.put(rec);
    return n.id;
  }
  return db.notes.add(rec);
}

/** Notes whose passage targets overlap the given chapters/refs. */
export async function notesForChapter(book: string, chapter: number): Promise<Note[]> {
  return db.notes.where('chapterKeys').equals(`${book}.${chapter}`).toArray();
}

export function rangesOverlap(a: Ref, b: Ref): boolean {
  if (a.book !== b.book) return false;
  const s1 = a.c1 * 1000 + (a.v1 ?? 0);
  const e1 = a.c2 * 1000 + (a.v2 ?? 999);
  const s2 = b.c1 * 1000 + (b.v1 ?? 0);
  const e2 = b.c2 * 1000 + (b.v2 ?? 999);
  return s1 <= e2 && s2 <= e1;
}

/** Apply (or clear, when color is null) a highlight over a verse range, splitting existing highlights as needed. */
export async function setHighlight(ref: Ref, color: HighlightColor | null, originEdition?: string) {
  const existing = await db.highlights.where('[book+c]').between([ref.book, ref.c1 - 1], [ref.book, ref.c2 + 1]).toArray();
  const keep = (h: Highlight) => !rangesOverlap(parseRefId(h.ref)!, ref);
  const toDelete: number[] = [];
  const toAdd: Highlight[] = [];
  for (const h of existing) {
    const r = parseRefId(h.ref)!;
    if (keep(h)) continue;
    toDelete.push(h.id!);
    // keep the non-overlapping remainders (single-chapter ranges only; cross-chapter highlights are cleared whole)
    if (r.c1 === r.c2 && ref.c1 === ref.c2 && r.c1 === ref.c1) {
      const a1 = r.v1 ?? 1;
      const a2 = r.v2 ?? 999;
      const b1 = ref.v1 ?? 1;
      const b2 = ref.v2 ?? 999;
      if (a1 < b1) toAdd.push({ ...h, id: undefined, ref: refId({ ...r, v1: a1, v2: b1 - 1 }) });
      if (a2 > b2) toAdd.push({ ...h, id: undefined, ref: refId({ ...r, v1: b2 + 1, v2: a2 }) });
    }
  }
  if (color) toAdd.push({ ref: refId(ref), book: ref.book, c: ref.c1, color, originEdition, createdAt: Date.now() });
  await db.transaction('rw', db.highlights, async () => {
    await db.highlights.bulkDelete(toDelete);
    await db.highlights.bulkAdd(toAdd);
  });
}

export async function toggleBookmark(ref: Ref, kind: Bookmark['kind'] = 'bookmark', originEdition?: string) {
  const id = refId(ref);
  const ex = await db.bookmarks.where('ref').equals(id).filter((b) => b.kind === kind).first();
  if (ex) {
    await db.bookmarks.delete(ex.id!);
    return false;
  }
  await db.bookmarks.add({ ref: id, kind, originEdition, createdAt: Date.now() });
  return true;
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

const TABLES = ['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'planProgress', 'userPlans', 'episodeProgress', 'queue', 'savedSearches', 'recentSearches', 'history', 'saved', 'libraryProgress'] as const;

export async function exportAll(): Promise<string> {
  const out: Record<string, unknown> = { format: 'studybible-export', version: 1, exportedAt: new Date().toISOString(), anchorScheme: 'clementine-vulgate' };
  for (const t of TABLES) out[t] = await (db as any)[t].toArray();
  return JSON.stringify(out, null, 1);
}

export async function importAll(json: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
  const data = JSON.parse(json);
  if (data.format !== 'studybible-export') throw new Error('Not a Study Bible export file.');
  let n = 0;
  await db.transaction('rw', TABLES.map((t) => (db as any)[t]), async () => {
    for (const t of TABLES) {
      const rows: any[] = data[t] ?? [];
      if (mode === 'replace') await (db as any)[t].clear();
      for (const r of rows) {
        const rec = { ...r };
        // merge mode: let new auto ids be assigned to avoid clobbering; keyed tables use put.
        if (['planProgress', 'episodeProgress', 'libraryProgress'].includes(t)) await (db as any)[t].put(rec);
        else {
          if (mode === 'merge') delete rec.id;
          if (t === 'saved') {
            const ex = await db.saved.where('key').equals(rec.key).first();
            if (ex) continue;
          }
          await (db as any)[t].add(rec);
        }
        n++;
      }
    }
  });
  return n;
}

export async function deleteAllData() {
  await db.delete();
  location.reload();
}

/** Notes → one Markdown document, grouped by passage, for use in any notes app. */
export async function exportNotesMarkdown(): Promise<string> {
  const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
  const lines = ['# My Study Bible notes', '', `_Exported ${new Date().toISOString().slice(0, 10)}_`, ''];
  for (const n of notes) {
    const where = n.targets
      .map((t) => {
        if (t.type === 'passage') {
          const r = parseRefId(t.ref);
          return r ? BOOKS.find((b) => b.id === r.book)!.name + ` ${r.c1}${r.v1 ? ':' + r.v1 : ''}${r.c2 !== r.c1 || r.v2 !== r.v1 ? '–' + (r.c2 !== r.c1 ? r.c2 + ':' : '') + (r.v2 ?? '') : ''} (${t.ref})` : t.ref;
        }
        return 'label' in t && t.label ? t.label : t.type;
      })
      .join('; ');
    lines.push(`## ${n.title || where || 'Note'}`, '', where ? `*${where}*` : '', n.tags.length ? `Tags: ${n.tags.map((t) => '#' + t).join(' ')}` : '', '', n.body, '', '---', '');
  }
  return lines.join('\n');
}

export function download(filename: string, text: string, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
