import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { loadShow, useShows } from '../../data/podcasts';
import type { BiayEpisode } from '../../data/content';
import { useFollows } from '../../lib/follow';
import EpisodeRow from './EpisodeRow';

interface Item { show: string; title: string; ep: BiayEpisode; next?: boolean }
const fmtDate = (d: string) => { const t = new Date(`${d}T12:00:00`); return Number.isNaN(+t) ? d : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };

/**
 * A feed of the podcasts you follow: the newest episodes of each, newest first across all of them. A year-long programme (the Catechism in a Year, the Rosary in a Year)
 * is not "new": it shows the next day you have not heard, ahead of the rest.
 */
export default function FollowedFeed({ limit = 12, onAll }: { limit?: number; onAll?: () => void }) {
  const follows = useFollows();
  const shows = useShows();
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.toArray(), []) ?? [];
  const [items, setItems] = useState<Item[] | null>(null);
  const [more, setMore] = useState(false);
  const followed = [...follows].filter((k) => !k.includes(':')).join(',');
  useEffect(() => {
    let live = true;
    if (!followed || !shows) { setItems(followed ? null : []); return; }
    Promise.all(followed.split(',').map(async (id) => {
      const s = shows.find((x) => x.id === id);
      const d = s ? await loadShow(id) : null;
      if (!s || !d) return [] as Item[];
      const done = new Set((await db.episodeProgress.filter((p) => !!p.completed).toArray()).map((p) => p.episodeId));
      if (s.programme) {
        const next = d.episodes.filter((e) => !done.has(e.id) && e.day).sort((a, b) => (a.day ?? 0) - (b.day ?? 0))[0];
        return next ? [{ show: id, title: s.title, ep: next, next: true } as Item] : [];
      }
      return [...d.episodes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((ep): Item => ({ show: id, title: s.title, ep }));
    })).then((r) => {
      if (!live) return;
      const all = r.flat();
      setItems([...all.filter((x) => x.next), ...all.filter((x) => !x.next).sort((a, b) => b.ep.date.localeCompare(a.ep.date))]);
    });
    return () => { live = false; };
  }, [followed, shows]);
  if (!followed) return null;
  if (!items) return <section className="sect"><h2 className="eyebrow-h">Latest from your podcasts</h2><div className="skeleton" style={{ height: 70 }} /></section>;
  if (items.length === 0) return null;
  const prog = new Map(progress.map((p) => [p.episodeId, p]));
  const queued = new Set(queue.map((q) => q.episodeId));
  const shown = more ? items : items.slice(0, limit);
  return (
    <section className="sect" aria-label="Latest from your podcasts">
      <h2 className="eyebrow-h">Latest from your podcasts</h2>
      <ul className="list ep-feed">
        {shown.map((it) => (
          <EpisodeRow key={it.ep.id} e={it.ep} progress={prog.get(it.ep.id)} inQueue={queued.has(it.ep.id)} page kicker={`${it.title} · ${it.next ? 'next up' : fmtDate(it.ep.date)}`} />
        ))}
      </ul>
      {items.length > limit && (onAll
        ? <button className="btn small ghost" onClick={onAll}>See all {items.length}</button>
        : <button className="btn small ghost" onClick={() => setMore(!more)}>{more ? 'Show fewer' : `Show ${items.length - limit} more`}</button>)}
    </section>
  );
}
