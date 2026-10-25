import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const key = (id: string) => `follow:${id}`;
/** The ids of the podcasts the reader follows. */
export function useFollows(): Set<string> {
  const rows = useLiveQuery(() => db.cache.where('key').startsWith('follow:').toArray(), []) ?? [];
  return new Set(rows.map((r) => r.key.slice(7)));
}
export const toggleFollow = async (id: string, on: boolean) => {
  if (on) await db.cache.put({ key: key(id), value: '1', ts: Date.now() });
  else await db.cache.delete(key(id));
};
