import { db } from '../db/db';
import { loadShow } from './podcasts';
import type { BiayEpisode } from './content';

/** The newest episode you have not finished, from the shows you follow: what to play when the queue runs out and the reader asked to keep going with favorites. */
export async function nextFavorite(exceptId?: string): Promise<BiayEpisode | undefined> {
  const rows = await db.cache.where('key').startsWith('follow:').toArray();
  const ids = rows.map((r) => r.key.slice(7)).filter((k) => !k.startsWith('ab:') && !k.startsWith('vc:'));
  const done = new Set((await db.episodeProgress.toArray()).filter((p) => p.completed).map((p) => p.episodeId));
  let best: BiayEpisode | undefined;
  for (const id of ids) {
    const d = await loadShow(id).catch(() => null);
    const ep = d?.episodes.find((e) => e.id !== exceptId && !done.has(e.id) && e.audio);
    if (ep && (!best || (ep.date ?? '') > (best.date ?? ''))) best = ep;
  }
  return best;
}
