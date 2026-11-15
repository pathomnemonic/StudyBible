/** Small pure helpers for the Collections list: search, a one-line summary and a copy. */
import type { Collection, Target } from '../db/db';
import { doneKeyMatches } from './collectionDone';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** true when every word typed appears in the name, the description or the label of any item */
export function matchesCollection(c: Pick<Collection, 'name' | 'description' | 'items'> & { tags?: string[] }, query: string, labelOf: (t: Target) => string): boolean {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = norm([c.name, c.description ?? '', ...(c.tags ?? []), ...c.items.map(labelOf)].join(' '));
  return words.every((w) => hay.includes(w));
}

/** "4 items, 1 done" (the done count only counts items still in the collection) */
export function collectionSummary(c: Pick<Collection, 'items' | 'done'>): string {
  const n = c.items.length;
  // Count each item once, using the same key-order-independent matcher as the collection page.
  const done = c.items.filter((item) => (c.done ?? []).some((key) => doneKeyMatches(key, item))).length;
  return `${n} ${n === 1 ? 'item' : 'items'}${done ? `, ${done} done` : ''}`;
}

/** a personal copy: same items, nothing ticked, a name that says it is a copy */
export function copyOfCollection(c: Pick<Collection, 'name' | 'description' | 'items' | 'tags'>, now = Date.now()): Omit<Collection, 'id'> {
  return { name: `${c.name} (copy)`, description: c.description, tags: c.tags ? [...c.tags] : undefined, items: c.items.map((t) => ({ ...t })), createdAt: now, updatedAt: now };
}

/** One reading-plan day for each Scripture passage in the collection, in the collection's order. Other kinds of item have no place in a reading plan and are left out. */
export function planDaysFromCollection(c: Pick<Collection, 'items'>): { refs: string[] }[] {
  return c.items.filter((t): t is Extract<Target, { type: 'passage' }> => t.type === 'passage').map((t) => ({ refs: [t.ref] }));
}

/** "prayer, Lent ,prayer" -> ["prayer", "Lent"]: trimmed, no empties, no repeats (ignoring case) */
export function parseTags(input: string): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const t of input.split(',').map((x) => x.trim()).filter(Boolean)) if (!seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); }
  return out;
}

export type CollectionSort = 'updated' | 'created' | 'name' | 'size';
/** a sorted copy; ties fall back to the name so the order is the same every time */
export function sortCollections<T extends Pick<Collection, 'name' | 'items' | 'createdAt' | 'updatedAt'>>(list: T[], by: CollectionSort): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  const cmp: Record<CollectionSort, (a: T, b: T) => number> = {
    updated: (a, b) => b.updatedAt - a.updatedAt,
    created: (a, b) => b.createdAt - a.createdAt,
    name: byName,
    size: (a, b) => b.items.length - a.items.length,
  };
  return [...list].sort((a, b) => cmp[by](a, b) || byName(a, b));
}

/** every tag in use, once each (ignoring case), alphabetically */
export function collectionTags(list: { tags?: string[] }[]): string[] {
  const seen = new Map<string, string>();
  for (const c of list) for (const t of c.tags ?? []) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
export const hasTag = (c: { tags?: string[] }, tag: string) => !tag || (c.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase());

/** a note matches when every word typed appears in its title, text, tags or the labels of what it points at */
export function matchesNote(n: { title?: string; body: string; tags: string[]; targets: Target[] }, query: string, labelOf: (t: Target) => string): boolean {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = norm([n.title ?? '', n.body, ...n.tags, ...n.targets.map(labelOf)].join(' '));
  return words.every((w) => hay.includes(w));
}

export type NoteSort = 'updated' | 'created' | 'title';
/** pinned notes stay first, then the chosen order */
export function sortNotes<T extends { title?: string; body: string; pinned?: boolean; createdAt: number; updatedAt: number }>(list: T[], by: NoteSort): T[] {
  const name = (n: T) => (n.title || n.body).trim().toLowerCase();
  const cmp: Record<NoteSort, (a: T, b: T) => number> = { updated: (a, b) => b.updatedAt - a.updatedAt, created: (a, b) => b.createdAt - a.createdAt, title: (a, b) => name(a).localeCompare(name(b)) };
  return [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || cmp[by](a, b));
}

/** a personal copy of a note: same text, tags, folder and links, not pinned, no history, a title that says it is a copy */
export function copyOfNote<N extends { title?: string; body: string; kind: string; targets: Target[]; tags: string[]; folderId?: number; originEdition?: string }>(n: N, now = Date.now()) {
  return { title: `${n.title || 'Note'} (copy)`, body: n.body, kind: n.kind, targets: n.targets.map((t) => ({ ...t })), tags: [...n.tags], folderId: n.folderId, originEdition: n.originEdition, chapterKeys: [] as string[], createdAt: now, updatedAt: now };
}
