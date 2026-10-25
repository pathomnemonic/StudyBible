import Dexie, { type Table } from 'dexie';

/** Fields the sync engine stamps on every user-created row. */
export interface Syncable {
  uid?: string;
  updatedAt?: number;
}

/**
 * Everything the user creates lives here, in IndexedDB on their own device, private by default.
 * Scripture links use *anchor* ids (Clementine Vulgate numbering, see versification.ts) so they survive a
 * change of translation. `originEdition` / `originRef` remember where the user actually made the mark.
 */

export type Target =
  | { type: 'passage'; ref: string; label?: string }
  | { type: 'commentary'; itemId: string; label: string; url?: string }
  | { type: 'catechism'; para: number; label?: string }
  | { type: 'work'; workId: string; section?: string; label: string }
  | { type: 'episode'; episodeId: string; label: string }
  | { type: 'reading'; date: string; label: string }
  | { type: 'topic'; topicId: string; label: string };

export type NoteKind = 'note' | 'question' | 'study' | 'prayer';

export interface Note extends Syncable {
  id?: number;
  title?: string;
  body: string; // Markdown
  kind: NoteKind;
  targets: Target[];
  tags: string[];
  folderId?: number;
  originEdition?: string;
  /** derived: "BOOK.chapter" keys of passage targets, for indexed lookup */
  chapterKeys?: string[];
  createdAt: number;
  updatedAt: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple';

export interface Highlight extends Syncable {
  id?: number;
  ref: string; // anchor refId of a verse range
  book: string;
  c: number; // first chapter (anchor)
  color: HighlightColor;
  originEdition?: string;
  createdAt: number;
}

export interface Bookmark extends Syncable {
  id?: number;
  ref: string;
  kind: 'bookmark' | 'later';
  label?: string;
  originEdition?: string;
  createdAt: number;
}

export interface Folder extends Syncable {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Collection extends Syncable {
  id?: number;
  name: string;
  description?: string;
  items: Target[];
  createdAt: number;
  updatedAt: number;
}

export interface UserXref extends Syncable {
  id?: number;
  from: string;
  to: string;
  comment?: string;
  createdAt: number;
}

export interface JournalEntry extends Syncable {
  id?: number;
  date: string; // YYYY-MM-DD
  kind: 'journal' | 'intention' | 'prayer';
  title?: string;
  body: string;
  refs: string[];
  answered?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlanProgress extends Syncable {
  planId: string; // builtin id or "user:<id>"
  startedAt: number;
  status: 'active' | 'paused' | 'finished';
  /** day indices (0-based) that are checked off */
  done: number[];
  /** shift applied to "today's" day, for adjusting a plan */
  offsetDays: number;
  pausedAt?: number;
}

export interface UserPlan extends Syncable {
  id?: number;
  name: string;
  description?: string;
  days: { title?: string; refs: string[] }[];
  createdAt: number;
}

export interface EpisodeProgress extends Syncable {
  episodeId: string;
  position: number; // seconds
  duration?: number;
  completed: boolean;
  updatedAt: number;
}

export interface QueueItem extends Syncable {
  id?: number;
  episodeId: string;
  order: number;
}

export interface SavedSearch extends Syncable {
  id?: number;
  query: string;
  filters?: Record<string, string>;
  createdAt: number;
}

export interface RecentSearch {
  id?: number;
  query: string;
  ts: number;
}

export interface HistoryEntry {
  id?: number;
  ts: number;
  type: 'read' | 'work' | 'episode' | 'catechism';
  ref: string;
  label: string;
}

export interface SavedItem extends Syncable {
  id?: number;
  key: string; // unique key e.g. "reading:2026-10-19", "ccc:1324"
  type: 'reading' | 'catechism' | 'work' | 'commentary';
  label: string;
  url?: string;
  createdAt: number;
}

export interface LibraryProgress extends Syncable {
  workId: string;
  section: string;
  scroll?: number;
  updatedAt: number;
}

export interface MediaItem extends Syncable {
  id?: number;
  title: string;
  url: string;
  note?: string;
  refs: string[];
  createdAt: number;
}

export interface UserLink extends Syncable {
  id?: number;
  ref: string; // anchor passage id
  url: string;
  title: string;
  sourceId?: string; // 'catholic-answers' | 'word-on-fire' | 'ascension' | ...
  note?: string;
  createdAt: number;
}

export interface MemoryCard extends Syncable {
  id?: number;
  ref: string; // anchor passage id
  set?: string; // themed set id
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: number;
  lastReviewed?: number;
  createdAt: number;
}

/** A copy of something the user deleted, kept on this device for a while so it can be restored. Never synced. */
export interface TrashItem {
  id?: number;
  tbl: string;
  data: any;
  deletedAt: number;
}

export const TRASH_TABLES = ['notes', 'journal', 'highlights', 'bookmarks', 'folders', 'collections'] as const;
export const TRASH_DAYS = 30;

export interface Tombstone {
  id?: number;
  tbl: string;
  uid: string;
  updatedAt: number;
}

export interface CacheRow {
  key: string;
  value: unknown;
  ts: number;
}

export const newUid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

/** Tables with an auto-increment local id; sync matches them across devices by `uid`. */
export const AUTO_TABLES = ['notes', 'highlights', 'bookmarks', 'folders', 'collections', 'userXrefs', 'journal', 'userPlans', 'saved', 'media', 'queue', 'savedSearches', 'userLinks', 'memory'] as const;
/** Tables keyed by a natural id (their key *is* the sync uid). */
export const KEYED_TABLES: Record<string, string> = { planProgress: 'planId', episodeProgress: 'episodeId', libraryProgress: 'workId' };

/** Set by the sync engine while it applies remote changes, so those writes are not re-stamped or tombstoned. */
export const syncFlags = { applying: false, onLocalChange: (() => {}) as () => void };

class StudyBibleDB extends Dexie {
  cache!: Table<CacheRow, string>;
  media!: Table<MediaItem, number>;
  userLinks!: Table<UserLink, number>;
  memory!: Table<MemoryCard, number>;
  tombs!: Table<Tombstone, number>;
  trash!: Table<TrashItem, number>;
  notes!: Table<Note, number>;
  highlights!: Table<Highlight, number>;
  bookmarks!: Table<Bookmark, number>;
  folders!: Table<Folder, number>;
  collections!: Table<Collection, number>;
  userXrefs!: Table<UserXref, number>;
  journal!: Table<JournalEntry, number>;
  planProgress!: Table<PlanProgress, string>;
  userPlans!: Table<UserPlan, number>;
  episodeProgress!: Table<EpisodeProgress, string>;
  queue!: Table<QueueItem, number>;
  savedSearches!: Table<SavedSearch, number>;
  recentSearches!: Table<RecentSearch, number>;
  history!: Table<HistoryEntry, number>;
  saved!: Table<SavedItem, number>;
  libraryProgress!: Table<LibraryProgress, string>;

  constructor() {
    super('studybible');
    this.version(1).stores({
      notes: '++id, kind, folderId, updatedAt, *tags, *chapterKeys',
      highlights: '++id, [book+c], ref, color',
      bookmarks: '++id, ref, kind, createdAt',
      folders: '++id',
      collections: '++id, updatedAt',
      userXrefs: '++id, from, to',
      journal: '++id, date, kind, updatedAt',
      planProgress: 'planId',
      userPlans: '++id',
      episodeProgress: 'episodeId, updatedAt',
      queue: '++id, order, episodeId',
      savedSearches: '++id',
      recentSearches: '++id, ts',
      history: '++id, ts, type',
      saved: '++id, &key, type',
      libraryProgress: 'workId',
    });
    this.version(2).stores({ cache: 'key' });
    this.version(3).stores({ media: '++id, createdAt' });
    // v4: every user-created table gets a `uid` (stable across devices) for sync; tombstones record deletions.
    this.version(4)
      .stores({
        notes: '++id, kind, folderId, updatedAt, *tags, *chapterKeys, uid',
        highlights: '++id, [book+c], ref, color, uid',
        bookmarks: '++id, ref, kind, createdAt, uid',
        folders: '++id, uid',
        collections: '++id, updatedAt, uid',
        userXrefs: '++id, from, to, uid',
        journal: '++id, date, kind, updatedAt, uid',
        userPlans: '++id, uid',
        saved: '++id, &key, type, uid',
        media: '++id, createdAt, uid',
        queue: '++id, order, episodeId, uid',
        savedSearches: '++id, uid',
        userLinks: '++id, ref, uid',
        tombs: '++id, tbl',
      })
      .upgrade(async (tx) => {
        // only tables that exist at this schema version (memory arrives in v5, and tx.table() throws for a table that is not there yet)
        const here = new Set(Array.from((tx as any).idbtrans.objectStoreNames as DOMStringList));
        // the change hooks would stamp every old row as edited just now, making it look newer than another device's copy
        syncFlags.applying = true;
        try {
          for (const t of AUTO_TABLES.filter((n) => here.has(n))) {
            await tx.table(t).toCollection().modify((r: any) => {
              r.uid ??= newUid();
              r.updatedAt ??= r.createdAt ?? Date.now();
            });
          }
        } finally {
          syncFlags.applying = false;
        }
      });
    this.version(5).stores({ memory: '++id, ref, due, uid' });
    this.version(6).stores({ trash: '++id, tbl, deletedAt' });
    this.installSyncHooks();
  }

  private installSyncHooks() {
    for (const name of AUTO_TABLES) {
      const t = this.table(name);
      t.hook('creating', (_pk, obj: any) => {
        if (syncFlags.applying) return;
        obj.uid ??= newUid();
        obj.updatedAt = Date.now();
        queueMicrotask(() => syncFlags.onLocalChange());
      });
      t.hook('updating', () => {
        if (syncFlags.applying) return;
        queueMicrotask(() => syncFlags.onLocalChange());
        return { updatedAt: Date.now() };
      });
      t.hook('deleting', function (_pk, obj: any) {
        if (syncFlags.applying || !obj?.uid) return;
        const uid = obj.uid as string;
        // runs after the delete commits (a different table cannot be written inside this transaction)
        this.onsuccess = () => {
          if ((TRASH_TABLES as readonly string[]).includes(name)) Dexie.ignoreTransaction(() => db.trash.add({ tbl: name, data: obj, deletedAt: Date.now() })).catch(() => {});
          Dexie.ignoreTransaction(() => db.tombs.add({ tbl: name, uid, updatedAt: Date.now() })).then(() => syncFlags.onLocalChange()).catch(() => {});
        };
      });
    }
    for (const [name, key] of Object.entries(KEYED_TABLES)) {
      const t = this.table(name);
      t.hook('creating', (_pk, obj: any) => {
        if (syncFlags.applying) return;
        obj.uid = obj[key];
        obj.updatedAt = Date.now();
        queueMicrotask(() => syncFlags.onLocalChange());
      });
      t.hook('updating', () => {
        if (syncFlags.applying) return;
        queueMicrotask(() => syncFlags.onLocalChange());
        return { updatedAt: Date.now() };
      });
      t.hook('deleting', function (pk: any) {
        if (syncFlags.applying) return;
        this.onsuccess = () => {
          Dexie.ignoreTransaction(() => db.tombs.add({ tbl: name, uid: String(pk), updatedAt: Date.now() })).then(() => syncFlags.onLocalChange()).catch(() => {});
        };
      });
    }
  }
}

export const db = new StudyBibleDB();
