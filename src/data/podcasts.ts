import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getJson } from './loader';
import type { BiayEpisode } from './content';

export interface Show {
  id: string;
  title: string;
  host: string;
  publisher: string;
  programme: boolean;
  tradition: string | null;
  category?: string;
  note: string;
  page: string;
  episodes: number;
  latest: string;
}
export interface ShowData { meta: Record<string, string>; episodes: BiayEpisode[] }

/** Every episode loaded so far, by id, so the player can continue through a queue that mixes shows. */
const registry = new Map<string, BiayEpisode>();
export const registerEpisodes = (list: BiayEpisode[]) => list.forEach((e) => registry.set(e.id, e));
export const lookupEpisode = (id: string) => registry.get(id);

export const getShows = () => getJson<{ generated: string; shows: Show[] }>('media/podcasts.json', true);
export async function loadShow(id: string): Promise<ShowData | null> {
  if (id.startsWith('u-')) { const { loadUserShow } = await import('./feeds'); return loadUserShow(id); }
  const d = await getJson<ShowData>(`media/podcast/${id}.json`, true);
  if (d) registerEpisodes(d.episodes);
  return d;
}

export function useShows() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const mine = useLiveQuery(() => db.saved.where('type').equals('podcast').toArray(), []);
  useEffect(() => {
    let off = false;
    Promise.all([getShows().catch(() => null), import('./feeds').then((f) => f.listUserShows())]).then(([d, u]) => { if (!off) setShows([...(d?.shows ?? []), ...u]); }).catch(() => { if (!off) setShows([]); });
    return () => { off = true; };
  }, [mine?.length]);
  return shows;
}
