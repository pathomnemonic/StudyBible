import { useEffect, useState } from 'react';
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
  const d = await getJson<ShowData>(`media/podcast/${id}.json`, true);
  if (d) registerEpisodes(d.episodes);
  return d;
}

export function useShows() {
  const [shows, setShows] = useState<Show[] | null>(null);
  useEffect(() => { getShows().then((d) => setShows(d?.shows ?? [])).catch(() => setShows([])); }, []);
  return shows;
}
