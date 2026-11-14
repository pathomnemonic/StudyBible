/** Small pure helpers for the Collections list: search, a one-line summary and a copy. */
import type { Collection, Target } from '../db/db';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** true when every word typed appears in the name, the description or the label of any item */
export function matchesCollection(c: Pick<Collection, 'name' | 'description' | 'items'>, query: string, labelOf: (t: Target) => string): boolean {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = norm([c.name, c.description ?? '', ...c.items.map(labelOf)].join(' '));
  return words.every((w) => hay.includes(w));
}

/** "4 items, 1 done" (the done count only counts items still in the collection) */
export function collectionSummary(c: Pick<Collection, 'items' | 'done'>): string {
  const n = c.items.length;
  const keys = new Set(c.items.map((t) => JSON.stringify(t)));
  const done = (c.done ?? []).filter((k) => keys.has(k)).length;
  return `${n} ${n === 1 ? 'item' : 'items'}${done ? `, ${done} done` : ''}`;
}

/** a personal copy: same items, nothing ticked, a name that says it is a copy */
export function copyOfCollection(c: Pick<Collection, 'name' | 'description' | 'items'>, now = Date.now()): Omit<Collection, 'id'> {
  return { name: `${c.name} (copy)`, description: c.description, items: c.items.map((t) => ({ ...t })), createdAt: now, updatedAt: now };
}
