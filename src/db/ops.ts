import { BRAND } from '../lib/brand';
import { AUTO_TABLES, KEYED_TABLES, db, newUid, syncFlags, type Bookmark, type Highlight, type HighlightColor, type Note, type Target } from './db';
import { parseRefId, refId, type Ref } from '../lib/refs';
import { BOOKS } from '../lib/canon';
import { isAppHashRoute, isHttpUrl } from '../lib/safeUrl';

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

import { nextHistory } from '../lib/noteHistory';

export async function saveNote(n: Omit<Note, 'createdAt' | 'updatedAt' | 'chapterKeys'> & { id?: number }): Promise<number> {
  const now = Date.now();
  const rec: Note = { ...n, chapterKeys: chapterKeysOf(n.targets), createdAt: now, updatedAt: now };
  if (n.id) {
    const old = await db.notes.get(n.id);
    rec.createdAt = old?.createdAt ?? now;
    const history = nextHistory(old, n, now);
    if (history.length) rec.history = history;
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

const TABLES = ['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'planProgress', 'userPlans', 'episodeProgress', 'queue', 'savedSearches', 'recentSearches', 'history', 'saved', 'libraryProgress', 'classes', 'classwork', 'media', 'userLinks', 'memory'] as const;

export async function exportAll(): Promise<string> {
  const out: Record<string, unknown> = { format: 'studybible-export', version: 2, appExport: 'all-tables-and-settings', exportedAt: new Date().toISOString(), anchorScheme: 'clementine-vulgate', counts: {} as Record<string, number> };
  // Read every exported table under one readonly transaction so a concurrent edit cannot produce
  // a backup assembled from different points in time (for example, a note without its new folder).
  await db.transaction('r', TABLES.map((t) => (db as any)[t]), async () => {
    for (const t of TABLES) {
      const rows = await (db as any)[t].toArray();
      out[t] = rows;
      (out.counts as Record<string, number>)[t] = rows.length;
    }
  });
  // reading and accessibility preferences live outside the database; include them so a restore feels the same
  try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) out.settings = JSON.parse(raw); } catch { /* storage unavailable */ }
  const local = collectLocal();
  // An explicit empty object distinguishes a current backup with no local keys from an older format that never exported them.
  out.local = local;
  try { localStorage.setItem('sb:lastExport', String(Date.now())); } catch { /* storage unavailable */ }
  return JSON.stringify(out, null, 1);
}

const SETTINGS_KEY = 'studybible.settings.v1';
/** Things kept in the browser's own storage (game streaks and bests, marked moments, your birthday, lesson notes) that a backup should carry across. */
const LOCAL_PREFIXES = ['sb:plays', 'sb:trophies', 'sb:daily:', 'sb:verbum', 'sb:crossword', 'sb:quartets', 'sb:prophet', 'sb:cloister', 'sb:charades:best', 'sb:marks:', 'sb:me:', 'sb:pray:done:', 'sb:cur:note:', 'sb:sticker', 'sb:passport', 'sb:slowBible', 'sb:pins', 'sb:recentItems'];
const isLocalKey = (k: string) => LOCAL_PREFIXES.some((p) => k.startsWith(p));
function collectLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && isLocalKey(k)) { const v = localStorage.getItem(k); if (v != null) out[k] = v; } } } catch { /* storage unavailable */ }
  return out;
}
const safeUrl = isHttpUrl;

/** Larger than any real backup (a few thousand long notes are a few megabytes); a bigger file is refused before it is parsed. */
export const MAX_IMPORT_CHARS = 100_000_000;

export async function importAll(json: string, mode: 'merge' | 'replace' = 'merge', options: { notify?: boolean } = {}): Promise<number> {
  if (json.length > MAX_IMPORT_CHARS) throw new Error('This file is far larger than any backup the app makes, so it was not opened. Nothing was imported.');
  let data: any;
  try { data = JSON.parse(json); } catch { throw new Error('The file is cut short or is not a backup. Nothing was imported.'); }
  if (!data || data.format !== 'studybible-export') throw new Error(`Not a ${BRAND.name} export file.`);
  if (mode === 'replace' && data.appExport === 'collections') throw new Error('This file holds only some collections, so it cannot replace everything. Import it with “merge”. Nothing was imported.');
  // A replace overwrites what is here: a failed safety copy must stop the restore before any data is touched.
  if (mode === 'replace') {
    try {
      await import('../lib/safety').then((m) => m.snapshotIfDue(true));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The storage operation failed.';
      throw new Error(`A safety copy could not be made. No data was replaced. ${detail}`);
    }
  }
  if (typeof data.version === 'number' && data.version > 2) throw new Error('This backup was made by a newer version of the app. Update the app, then try again.');
  // check the whole file before touching the database
  for (const t of TABLES) {
    const rows = data[t];
    if (rows === undefined) continue;
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) throw new Error(`The backup is damaged: “${t}” is not a list of records. Nothing was imported.`);
  }
  for (const t of ['userLinks', 'media'] as const) for (const r of data[t] ?? []) if (r.url !== undefined && !safeUrl(r.url)) throw new Error(`The backup has a link in “${t}” that does not start with http or https. Nothing was imported.`);
  let n = 0;
  const auto = new Set<string>(AUTO_TABLES);
  // IDs present before a replace; read them in the same transaction as the restore so no concurrent edit is missed.
  const before: [string, string][] = [];
  const after = new Set<string>();
  // Restore without the change hooks: they would stamp every row as just edited and tombstone each row cleared by a replace
  // (and a tombstone for a restored row's uid would delete it again on the next sync). Rows keep their own timestamps.
  syncFlags.applying = true;
  try {
    await db.transaction('rw', [...TABLES.map((t) => (db as any)[t]), db.tombs, db.trash], async () => {
      if (mode === 'replace') {
        // Trash belongs to the pre-restore dataset and is not part of an export; do not let an old
        // deleted record reappear in Undo after the user replaces all data from a backup.
        await db.trash.clear();
        // Capture both auto-table UIDs and natural keys while the restore transaction holds the database.
        for (const t of auto) for (const r of await (db as any)[t].toArray()) if (r.uid) before.push([t, r.uid]);
        for (const [t, keyField] of Object.entries(KEYED_TABLES)) {
          for (const r of await (db as any)[t].toArray()) {
            const key = r[keyField];
            if (key !== undefined && key !== null && key !== '') before.push([t, String(key)]);
          }
        }
        // Keep prior deletions too. Clearing them without carrying them forward lets another device
        // resurrect rows that were already deleted before this backup was restored.
        for (const tomb of await db.tombs.toArray()) before.push([tomb.tbl, tomb.uid]);
        // Existing tombstones are replaced by the combined set derived from live rows and old tombstones.
        await db.tombs.clear();
      }
      // folders go first: a merge gives rows new ids, and the notes in a folder must follow the folder to its new id (or to the one it already has here)
      const folderIds = new Map<number, number>();
      for (const t of ['folders', ...TABLES.filter((x) => x !== 'folders')] as typeof TABLES[number][]) {
        const rows: any[] = data[t] ?? [];
        if (mode === 'replace') await (db as any)[t].clear();
        for (const r of rows) {
          const rec = { ...r };
          if (t === 'notes' && mode === 'merge' && rec.folderId != null) { const to = folderIds.get(rec.folderId); if (to !== undefined) rec.folderId = to; else delete rec.folderId; }
          const oldId = rec.id;
          if (auto.has(t)) {
            rec.uid ??= newUid();
            rec.updatedAt ??= rec.createdAt ?? Date.now();
          }
          // Natural-key records must obey the same last-writer-wins rule as sync. An old backup must not
          // roll back newer listening, plan, shelf, class or classwork progress on this device.
          if (Object.prototype.hasOwnProperty.call(KEYED_TABLES, t)) {
            const keyField = KEYED_TABLES[t];
            const key = rec[keyField];
            if (key === undefined || key === null || key === '') throw new Error(`The backup is damaged: “${t}” has no ${keyField}.`);
            const table = (db as any)[t];
            const current = await table.get(key);
            const revision = (row: any): number => {
              for (const field of ['updatedAt', 'createdAt', 'startedAt', 'ts']) {
                if (typeof row?.[field] === 'number' && Number.isFinite(row[field])) return row[field];
              }
              const date = typeof row?.date === 'string' ? Date.parse(row.date) : NaN;
              return Number.isFinite(date) ? date : 0;
            };
            if (mode === 'replace' || !current || revision(rec) > revision(current)) {
              // Keyed sync identity is the natural primary key; never trust a stale or mismatched exported uid.
              rec.uid = String(key);
              rec.updatedAt ??= Date.now();
              await table.put(rec);
            }
            if (rec.uid) after.add(`${t}|${rec.uid}`);
            n++;
            continue;
          }
          // merge mode: let new auto ids be assigned to avoid clobbering; keyed tables are handled above.
          {
            if (mode === 'merge') delete rec.id;
            if (t === 'saved') {
              const ex = await db.saved.where('key').equals(rec.key).first();
              if (ex) continue;
            }
            // Re-importing an export must not duplicate rows: match by uid and keep the newer one.
            const ex = rec.uid ? await (db as any)[t].where('uid').equals(rec.uid).first() : undefined;
            if (ex) {
              if ((ex.updatedAt ?? 0) < (rec.updatedAt ?? 0)) await (db as any)[t].put({ ...rec, id: ex.id });
              if (t === 'folders' && oldId != null) folderIds.set(oldId, ex.id);
              after.add(`${t}|${rec.uid}`);
              continue;
            }
            const newId = await (db as any)[t].add(rec);
            if (t === 'folders' && oldId != null) folderIds.set(oldId, newId);
          }
          if (rec.uid) after.add(`${t}|${rec.uid}`);
          n++;
        }
      }
      if (mode === 'replace') {
        const gone = before.filter(([t, uid]) => !after.has(`${t}|${uid}`));
        if (gone.length) await db.tombs.bulkAdd(gone.map(([tbl, uid]) => ({ tbl, uid, updatedAt: Date.now() }) as any));
      }
    });
  } finally {
    syncFlags.applying = false;
  }
  if (options.notify !== false) syncFlags.onLocalChange();
  if (mode === 'replace' && data.settings && typeof data.settings === 'object') {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings)); } catch { /* storage unavailable */ }
  }
  // Game streaks, bests and the like follow the same merge/replace semantics as database rows.
  // A current export always carries local (even when empty); older exports without it remain compatible.
  if (data.local && typeof data.local === 'object' && !Array.isArray(data.local)) {
    if (mode === 'replace') {
      const incoming = new Set(Object.entries(data.local as Record<string, unknown>)
        .filter(([k, v]) => isLocalKey(k) && typeof v === 'string')
        .map(([k]) => k));
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && isLocalKey(k) && !incoming.has(k)) localStorage.removeItem(k);
        }
      } catch { /* storage unavailable */ }
    }
    for (const [k, v] of Object.entries(data.local as Record<string, unknown>)) {
      if (typeof v !== 'string' || !isLocalKey(k)) continue;
      try { if (mode === 'replace' || localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch { /* storage unavailable */ }
    }
  }
  return n;
}

export async function deleteAllData() {
  await db.delete();
  location.reload();
}

/** Notes → one Markdown document, grouped by passage, for use in any notes app. */
/** `only` narrows the export to notes carrying that tag; with no `only`, every note is exported */
export async function exportNotesMarkdown(only?: { tag?: string }): Promise<string> {
  const notes = (await db.notes.orderBy('updatedAt').reverse().toArray()).filter((n) => !only?.tag || n.tags.includes(only.tag));
  const lines = [`# My ${BRAND.name} notes`, '', `_Exported ${new Date().toISOString().slice(0, 10)}_`, ''];
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

const csvCell = (v: unknown) => {
  let t = String(v ?? '');
  // a cell that starts with = + - @ is read as a formula by spreadsheets: a leading apostrophe keeps it as text
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Highlights and bookmarks as CSV (spreadsheets) or Markdown (any notes app). Passage ids are the app's stable Vulgate-anchored ids. */
export async function exportMarks(format: 'csv' | 'md'): Promise<string> {
  const [hl, bm] = await Promise.all([db.highlights.toArray(), db.bookmarks.toArray()]);
  const name = (id: string) => {
    const r = parseRefId(id);
    return r ? `${BOOKS.find((b) => b.id === r.book)!.name} ${r.c1}${r.v1 ? ':' + r.v1 : ''}${r.c2 !== r.c1 || (r.v2 && r.v2 !== r.v1) ? '–' + (r.c2 !== r.c1 ? r.c2 + ':' : '') + (r.v2 ?? '') : ''}` : id;
  };
  if (format === 'csv') {
    const rows = [['type', 'reference', 'anchor_id', 'colour_or_kind', 'label', 'created']];
    for (const h of hl) rows.push(['highlight', name(h.ref), h.ref, h.color, '', new Date(h.createdAt).toISOString()]);
    for (const b of bm) rows.push(['bookmark', name(b.ref), b.ref, b.kind, b.label ?? '', new Date(b.createdAt).toISOString()]);
    return rows.map((r) => r.map(csvCell).join(',')).join('\n');
  }
  const out = ['# My highlights and bookmarks', ''];
  out.push('## Highlights', '', ...hl.map((h) => `- ${name(h.ref)} — ${h.color}`), '', '## Bookmarks', '', ...bm.map((b) => `- ${name(b.ref)}${b.label ? ' — ' + b.label : ''}${b.kind === 'later' ? ' (read later)' : ''}`));
  return out.join('\n');
}

/** What an export file contains, without changing anything, so you can check it before importing. */
export function previewImport(json: string): { counts: Record<string, number>; exportedAt?: string } {
  if (json.length > MAX_IMPORT_CHARS) throw new Error('This file is far larger than any backup the app makes, so it was not opened. Nothing was imported.');
  let data: any;
  try { data = JSON.parse(json); } catch { throw new Error('The file is cut short or is not a backup. Nothing was imported.'); }
  if (!data || data.format !== 'studybible-export') throw new Error(`Not a ${BRAND.name} export file.`);
  const counts: Record<string, number> = {};
  for (const t of TABLES) if (Array.isArray(data[t]) && data[t].length) counts[t] = data[t].length;
  return { counts, exportedAt: data.exportedAt };
}

// ---------------------------------------------------------------------------
// Collections on their own: one or all, to a file and back
// ---------------------------------------------------------------------------

/** One collection (or all of them) as a file in the same format as the backup, holding only those collections and the notes, highlights and bookmarks they point at (so the pointers still lead somewhere on another device). */
export async function exportCollections(ids?: number[]): Promise<string> {
  const all = await db.collections.toArray();
  const cs = ids ? all.filter((c) => ids.includes(c.id!)) : all;
  const want = { note: new Set<string>(), highlight: new Set<string>(), bookmark: new Set<string>() };
  for (const c of cs) for (const t of c.items) if (t.type === 'note' || t.type === 'highlight' || t.type === 'bookmark') want[t.type].add(t.uid);
  const notes = (await db.notes.toArray()).filter((n) => n.uid && want.note.has(n.uid)).map(({ folderId: _f, ...n }) => n);
  const highlights = (await db.highlights.toArray()).filter((h) => h.uid && want.highlight.has(h.uid));
  const bookmarks = (await db.bookmarks.toArray()).filter((b) => b.uid && want.bookmark.has(b.uid));
  const out = { format: 'studybible-export', version: 2, appExport: 'collections', exportedAt: new Date().toISOString(), anchorScheme: 'clementine-vulgate', counts: { collections: cs.length, notes: notes.length, highlights: highlights.length, bookmarks: bookmarks.length }, collections: cs, notes, highlights, bookmarks };
  return JSON.stringify(out, null, 1);
}

/** Reads a collections file back. A collection already here (same uid) gains the items, ticks and tags it lacks, so nothing is duplicated or lost; the rest are added. */
export async function importCollections(json: string): Promise<{ added: number; merged: number; records: number }> {
  if (json.length > MAX_IMPORT_CHARS) throw new Error('This file is far larger than any collections file the app makes, so it was not opened. Nothing was imported.');
  let data: any;
  try { data = JSON.parse(json); } catch { throw new Error('The file is cut short or is not a collections file. Nothing was imported.'); }
  if (!data || data.format !== 'studybible-export' || !Array.isArray(data.collections)) throw new Error('This is not a collections file. Nothing was imported.');
  const validTarget = (item: any): boolean => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    switch (item.type) {
      case 'passage': return typeof item.ref === 'string';
      case 'commentary': return typeof item.itemId === 'string' && item.itemId.length > 0 && typeof item.label === 'string' && (item.url === undefined || isHttpUrl(item.url));
      case 'catechism': return Number.isInteger(item.para) && item.para > 0;
      case 'work': return typeof item.workId === 'string' && typeof item.label === 'string';
      case 'episode': return typeof item.episodeId === 'string' && typeof item.label === 'string';
      case 'reading': return typeof item.date === 'string' && typeof item.label === 'string';
      case 'topic': return typeof item.topicId === 'string' && typeof item.label === 'string';
      case 'note': case 'highlight': case 'bookmark': return typeof item.uid === 'string';
      case 'link': return (isHttpUrl(item.url) || isAppHashRoute(item.url)) && typeof item.label === 'string' && item.label.trim().length > 0;
      default: return false;
    }
  };
  const validCollection = (raw: any): boolean =>
    !!raw && typeof raw === 'object' && !Array.isArray(raw) &&
    typeof raw.name === 'string' && raw.name.trim().length > 0 &&
    Array.isArray(raw.items) && raw.items.every(validTarget) &&
    (raw.tags === undefined || (Array.isArray(raw.tags) && raw.tags.every((tag: unknown) => typeof tag === 'string'))) &&
    (raw.done === undefined || (Array.isArray(raw.done) && raw.done.every((key: unknown) => typeof key === 'string'))) &&
    (raw.uid === undefined || (typeof raw.uid === 'string' && raw.uid.trim().length > 0));
  if (!data.collections.every(validCollection)) throw new Error('The collections file is damaged. Nothing was imported.');
  const { sameValue } = await import('../lib/canonical');
  const { doneKeyMatches } = await import('../lib/collections');
  // Collection imports can merge into existing collections, so keep a local safety copy before any writes.
  try { await import('../lib/safety').then((m) => m.snapshotIfDue(true)); }
  catch (error) {
    const detail = error instanceof Error ? error.message : 'The storage operation failed.';
    throw new Error(`A safety copy could not be made. Nothing was imported. ${detail}`);
  }
  // A collections file may carry only the records it points at, never unrelated tables or settings.
  // Keep every write in one transaction: if either the records or collections fail, neither is imported.
  const rest = {
    format: 'studybible-export',
    version: data.version,
    notes: data.notes ?? [],
    highlights: data.highlights ?? [],
    bookmarks: data.bookmarks ?? [],
  };
  const tables = [...TABLES.map((t) => (db as any)[t]), db.tombs, db.trash];
  const wasApplying = syncFlags.applying;
  let records = 0, added = 0, merged = 0;
  try {
    await db.transaction('rw', tables, async () => {
      records = await importAll(JSON.stringify(rest), 'merge', { notify: false });
      // importAll restores the hook flag in its finally block; keep collection writes in restore mode too.
      syncFlags.applying = true;
      for (const raw of data.collections) {
    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !Array.isArray(raw.items)) continue;
    const { id: _id, ...rec } = raw;
    const ex = rec.uid ? await db.collections.where('uid').equals(rec.uid).first() : undefined;
    if (!ex) { await db.collections.add({ ...rec, uid: rec.uid ?? newUid(), createdAt: rec.createdAt ?? Date.now(), updatedAt: rec.updatedAt ?? Date.now() }); added++; continue; }
    const items = [...ex.items];
    for (const t of rec.items) if (!items.some((x) => sameValue(x, t))) items.push(t);
    const done = [...(ex.done ?? [])];
    for (const k of rec.done ?? []) if (typeof k === 'string' && !done.some((d) => d === k || (() => { try { return doneKeyMatches(d, JSON.parse(k)); } catch { return false; } })())) done.push(k);
    const tags = [...(ex.tags ?? [])];
    for (const t of rec.tags ?? []) if (!tags.some((x) => x.toLowerCase() === String(t).toLowerCase())) tags.push(t);
    const newer = (rec.updatedAt ?? 0) > (ex.updatedAt ?? 0);
    await db.collections.put({ ...ex, name: newer ? rec.name : ex.name, description: newer ? rec.description ?? ex.description : ex.description, items, done: done.length ? done : undefined, tags: tags.length ? tags : undefined, updatedAt: Math.max(ex.updatedAt ?? 0, rec.updatedAt ?? 0, Date.now()) });
    merged++;
      }
    });
  } finally {
    syncFlags.applying = wasApplying;
  }
  if (!wasApplying) syncFlags.onLocalChange();
  return { added, merged, records };
}
