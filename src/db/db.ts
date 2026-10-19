import Dexie, { type Table } from 'dexie';

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

export interface Note {
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

export interface Highlight {
  id?: number;
  ref: string; // anchor refId of a verse range
  book: string;
  c: number; // first chapter (anchor)
  color: HighlightColor;
  originEdition?: string;
  createdAt: number;
}

export interface Bookmark {
  id?: number;
  ref: string;
  kind: 'bookmark' | 'later';
  label?: string;
  originEdition?: string;
  createdAt: number;
}

export interface Folder {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Collection {
  id?: number;
  name: string;
  description?: string;
  items: Target[];
  createdAt: number;
  updatedAt: number;
}

export interface UserXref {
  id?: number;
  from: string;
  to: string;
  comment?: string;
  createdAt: number;
}

export interface JournalEntry {
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

export interface PlanProgress {
  planId: string; // builtin id or "user:<id>"
  startedAt: number;
  status: 'active' | 'paused' | 'finished';
  /** day indices (0-based) that are checked off */
  done: number[];
  /** shift applied to "today's" day, for adjusting a plan */
  offsetDays: number;
  pausedAt?: number;
}

export interface UserPlan {
  id?: number;
  name: string;
  description?: string;
  days: { title?: string; refs: string[] }[];
  createdAt: number;
}

export interface EpisodeProgress {
  episodeId: string;
  position: number; // seconds
  duration?: number;
  completed: boolean;
  updatedAt: number;
}

export interface QueueItem {
  id?: number;
  episodeId: string;
  order: number;
}

export interface SavedSearch {
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

export interface SavedItem {
  id?: number;
  key: string; // unique key e.g. "reading:2026-10-19", "ccc:1324"
  type: 'reading' | 'catechism' | 'work' | 'commentary';
  label: string;
  url?: string;
  createdAt: number;
}

export interface LibraryProgress {
  workId: string;
  section: string;
  scroll?: number;
  updatedAt: number;
}

class StudyBibleDB extends Dexie {
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
  }
}

export const db = new StudyBibleDB();
