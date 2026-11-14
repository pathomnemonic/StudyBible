/** Small pure helpers for the Collections list: search, a one-line summary and a copy. */
import type { Collection, Target } from '../db/db';

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
  const keys = new Set(c.items.map((t) => JSON.stringify(t)));
  const done = (c.done ?? []).filter((k) => keys.has(k)).length;
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
