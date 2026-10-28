import { loadBiay } from './biay';
import { allRecordedWorks } from './librivox';
import { lookupEpisode, loadShow } from './podcasts';
import { getLibraryIndex, type BiayEpisode } from './content';
import { epOf } from '../components/RecordedBooks';

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

/** A queue as text that fits in a link: just the episode ids, which any device can look up again. */
export const encodeQueue = (ids: string[]) => b64(JSON.stringify(ids));
export function decodeQueue(q: string): string[] {
  try { const a = JSON.parse(unb64(q)); return Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 200) : []; } catch { return []; }
}

/** Finds an episode from its id alone: a Bible in a Year day, a podcast episode, or a part of a recorded book. */
export async function resolveAny(id: string): Promise<BiayEpisode | undefined> {
  const known = lookupEpisode(id);
  if (known) return known;
  if (id.startsWith('pod-')) {
    const show = /^pod-(.+)-[0-9a-f]{10}$/.exec(id)?.[1];
    if (!show) return undefined;
    await loadShow(show).catch(() => null);
    return lookupEpisode(id);
  }
  if (id.startsWith('lv:')) {
    const [, rec, part] = id.split(':');
    const works = await allRecordedWorks();
    const lib = await getLibraryIndex();
    for (const [workId, recs] of Object.entries(works)) {
      const r = recs.find((x) => x.id === rec);
      if (r && r.parts[+part]) return epOf(workId, lib?.works.find((w) => w.id === workId)?.title ?? workId, r, +part);
    }
    return undefined;
  }
  return (await loadBiay())?.byId.get(id);
}

export const queueLink = (ids: string[]) => `${location.href.split('#')[0]}#/s/queue?q=${encodeQueue(ids)}`;
