import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const norm = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ');
const KEEP = 20;

/** Remember a search once: the same words typed again (in any case) move to the front instead of piling up, and only the last twenty are kept. */
export async function addRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  await db.transaction('rw', db.recentSearches, async () => {
    const all = await db.recentSearches.toArray();
    const same = all.filter((r) => norm(r.query) === norm(q)).map((r) => r.id!);
    if (same.length) await db.recentSearches.bulkDelete(same);
    await db.recentSearches.add({ query: q, ts: Date.now() });
    const rest = (await db.recentSearches.orderBy('ts').toArray());
    if (rest.length > KEEP) await db.recentSearches.bulkDelete(rest.slice(0, rest.length - KEEP).map((r) => r.id!));
  });
}

/** The most recent distinct searches, newest first. */
export function useRecentSearches(n = 5) {
  return useLiveQuery(async () => {
    const rows = await db.recentSearches.orderBy('ts').reverse().limit(60).toArray();
    const seen = new Set<string>();
    return rows.filter((r) => { const k = norm(r.query); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, n);
  }, [n]) ?? [];
}
export const clearRecentSearches = () => db.recentSearches.clear();
