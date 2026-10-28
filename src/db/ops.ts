import { BRAND } from '../lib/brand';
import { AUTO_TABLES, db, newUid, syncFlags, type Bookmark, type Highlight, type HighlightColor, type Note, type Target } from './db';
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

const TABLES = ['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'planProgress', 'userPlans', 'episodeProgress', 'queue', 'savedSearches', 'recentSearches', 'history', 'saved', 'libraryProgress', 'classes', 'classwork', 'media', 'userLinks', 'memory'] as const;

export async function exportAll(): Promise<string> {
  const out: Record<string, unknown> = { format: 'studybible-export', version: 2, appExport: 'all-tables-and-settings', exportedAt: new Date().toISOString(), anchorScheme: 'clementine-vulgate', counts: {} as Record<string, number> };
  for (const t of TABLES) { const rows = await (db as any)[t].toArray(); out[t] = rows; (out.counts as Record<string, number>)[t] = rows.length; }
  // reading and accessibility preferences live outside the database; include them so a restore feels the same
  try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) out.settings = JSON.parse(raw); } catch { /* storage unavailable */ }
  const local = collectLocal();
  if (Object.keys(local).length) out.local = local;
  try { localStorage.setItem('sb:lastExport', String(Date.now())); } catch { /* storage unavailable */ }
  return JSON.stringify(out, null, 1);
}

const SETTINGS_KEY = 'studybible.settings.v1';
/** Things kept in the browser's own storage (game streaks and bests, marked moments, your birthday, lesson notes) that a backup should carry across. */
const LOCAL_PREFIXES = ['sb:plays', 'sb:trophies', 'sb:daily:', 'sb:verbum', 'sb:crossword', 'sb:quartets', 'sb:prophet', 'sb:cloister', 'sb:charades:best', 'sb:marks:', 'sb:me:', 'sb:pray:done:', 'sb:cur:note:', 'sb:sticker'];
const isLocalKey = (k: string) => LOCAL_PREFIXES.some((p) => k.startsWith(p));
function collectLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && isLocalKey(k)) { const v = localStorage.getItem(k); if (v != null) out[k] = v; } } } catch { /* storage unavailable */ }
  return out;
}
const safeUrl = (u: unknown) => typeof u === 'string' && /^https?:\/\//i.test(u);

export async function importAll(json: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
  const data = JSON.parse(json);
  if (data.format !== 'studybible-export') throw new Error(`Not a ${BRAND.name} export file.`);
  // a replace overwrites what is here: keep a safety copy first so a wrong file can be undone
  if (mode === 'replace') await import('../lib/safety').then((m) => m.snapshotIfDue(true)).catch(() => undefined);
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
  // uids present before a replace, so rows that the backup does not contain can be recorded as deleted for other devices
  const before: [string, string][] = [];
  if (mode === 'replace') for (const t of auto) for (const r of await (db as any)[t].toArray()) if (r.uid) before.push([t, r.uid]);
  const after = new Set<string>();
  // Restore without the change hooks: they would stamp every row as just edited and tombstone each row cleared by a replace
  // (and a tombstone for a restored row's uid would delete it again on the next sync). Rows keep their own timestamps.
  syncFlags.applying = true;
  try {
    await db.transaction('rw', [...TABLES.map((t) => (db as any)[t]), db.tombs], async () => {
      // restoring over everything also drops old deletion records, which would otherwise delete the restored rows when synced
      if (mode === 'replace') await db.tombs.clear();
      for (const t of TABLES) {
        const rows: any[] = data[t] ?? [];
        if (mode === 'replace') await (db as any)[t].clear();
        for (const r of rows) {
          const rec = { ...r };
          if (auto.has(t)) {
            rec.uid ??= newUid();
            rec.updatedAt ??= rec.createdAt ?? Date.now();
          }
          // merge mode: let new auto ids be assigned to avoid clobbering; keyed tables use put.
          if (['planProgress', 'episodeProgress', 'libraryProgress', 'classes', 'classwork'].includes(t)) await (db as any)[t].put(rec);
          else {
            if (mode === 'merge') delete rec.id;
            if (t === 'saved') {
              const ex = await db.saved.where('key').equals(rec.key).first();
              if (ex) continue;
            }
            // Re-importing an export must not duplicate rows: match by uid and keep the newer one.
            const ex = rec.uid ? await (db as any)[t].where('uid').equals(rec.uid).first() : undefined;
            if (ex) {
              if ((ex.updatedAt ?? 0) < (rec.updatedAt ?? 0)) await (db as any)[t].put({ ...rec, id: ex.id });
              after.add(`${t}|${rec.uid}`);
              continue;
            }
            await (db as any)[t].add(rec);
          }
          if (rec.uid) after.add(`${t}|${rec.uid}`);
          n++;
        }
      }
    });
  } finally {
    syncFlags.applying = false;
  }
  if (mode === 'replace') {
    const gone = before.filter(([t, uid]) => !after.has(`${t}|${uid}`));
    if (gone.length) await db.tombs.bulkAdd(gone.map(([tbl, uid]) => ({ tbl, uid, updatedAt: Date.now() }) as any));
  }
  syncFlags.onLocalChange();
  if (mode === 'replace' && data.settings && typeof data.settings === 'object') {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings)); } catch { /* storage unavailable */ }
  }
  // game streaks, bests and the like: a merge only fills in what this device does not have; a replace overwrites
  if (data.local && typeof data.local === 'object') {
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
export async function exportNotesMarkdown(): Promise<string> {
  const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
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
  const data = JSON.parse(json);
  if (data.format !== 'studybible-export') throw new Error(`Not a ${BRAND.name} export file.`);
  const counts: Record<string, number> = {};
  for (const t of TABLES) if (Array.isArray(data[t]) && data[t].length) counts[t] = data[t].length;
  return { counts, exportedAt: data.exportedAt };
}
