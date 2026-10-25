import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration } from '../../data/biay';
import { usePlayer } from '../../data/PlayerContext';
import { loadShow, lookupEpisode, type Show, type ShowData } from '../../data/podcasts';
import type { BiayEpisode } from '../../data/content';
import { fold } from '../../search/engine';
import Icon from '../../components/Icon';

type View = 'plan' | 'all' | 'queue' | 'progress';

/** A podcast or year-long programme from its publisher's own feed. Episode lists are metadata; the audio plays from the publisher. */
export default function PodcastView({ show }: { show: Show }) {
  const player = usePlayer();
  const [data, setData] = useState<ShowData | null | undefined>(undefined);
  const [view, setView] = useState<View>(show.programme ? 'plan' : 'all');
  const [q, setQ] = useState('');
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const doneMap = useMemo(() => new Map(progress.map((p) => [p.episodeId, p])), [progress]);
  useEffect(() => { setData(undefined); setView(show.programme ? 'plan' : 'all'); setQ(''); loadShow(show.id).then(setData).catch(() => setData(null)); }, [show.id]);

  const list = useMemo(() => {
    if (!data) return [] as BiayEpisode[];
    if (view === 'plan') {
      // one episode for each day of the programme: the latest release
      const byDay = new Map<number, BiayEpisode>();
      for (const e of data.episodes) if (e.day && (!byDay.has(e.day) || (e.year ?? 0) > (byDay.get(e.day)!.year ?? 0))) byDay.set(e.day, e);
      return [...byDay.keys()].sort((a, b) => a - b).map((d) => byDay.get(d)!);
    }
    if (view === 'queue') return queue.map((x) => lookupEpisode(x.episodeId)).filter(Boolean) as BiayEpisode[];
    if (view === 'progress') return progress.filter((p) => p.completed || p.position > 0).sort((a, b) => b.updatedAt - a.updatedAt).map((p) => lookupEpisode(p.episodeId)).filter((e): e is BiayEpisode => !!e && e.id.startsWith(`pod-${show.id}-`));
    return data.episodes;
  }, [data, view, queue, progress, show.id]);
  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return list;
    const num = /^(?:day\s*)?(\d{1,3})$/i.exec(s);
    if (num && show.programme) return list.filter((e) => e.day === +num[1]);
    const n = /^(?:ccc\s*|§\s*)?(\d{1,4})$/i.exec(s);
    if (n && show.id === 'catechism-in-a-year') return list.filter((e) => e.ccc?.some(([a, b]) => +n[1] >= a && +n[1] <= b));
    const f = fold(s);
    return list.filter((e) => fold(`${e.title} ${e.description}`).includes(f));
  }, [list, q, show]);

  const todayDay = (() => { const start = new Date(new Date().getFullYear(), 0, 1); return Math.floor((Date.now() - start.getTime()) / 86400000) + 1; })();
  const todaysEp = show.programme ? list.find((e) => e.day === todayDay) : undefined;

  return (
    <section aria-label={show.title}>
      <h2 className="h-sm" style={{ marginBottom: 2 }}>{show.title}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>{show.host}{show.publisher && show.publisher !== show.host ? ` · ${show.publisher}` : ''}{show.note ? ` · ${show.note}` : ''}</p>
      <p className="muted small">Episode lists come from the publisher’s own public feed, and the audio plays from them; nothing is copied. <a href={show.page} target="_blank" rel="noreferrer noopener">The publisher’s page</a>.{show.tradition ? ' Made for an Eastern Catholic audience.' : ''}</p>
      {data === undefined && <div className="center-note">Loading episodes…</div>}
      {data === null && <div className="notice">The episode list for this show is missing. It is built with <code>npx tsx scripts/podcasts/build.ts</code>.</div>}
      {data && (
        <>
          {todaysEp && view === 'plan' && !q && (
            <div className="card" style={{ margin: '10px 0' }}>
              <strong>Day {todaysEp.day} of the year</strong> <span className="muted small">(by the calendar; start any day from Day 1)</span>
              <div>{todaysEp.short}</div>
              <button className="btn primary small" onClick={() => player.play(todaysEp)}><Icon name="play" size={14} /> Play</button>
            </div>
          )}
          <div className="tabbar" role="tablist">
            {([...(show.programme ? [['plan', 'The programme']] : []), ['all', show.programme ? 'All episodes' : 'Latest episodes'], ['queue', `Queue (${queue.length})`], ['progress', 'My progress']] as [View, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{l}</button>
            ))}
          </div>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={show.id === 'catechism-in-a-year' ? 'Day number, topic, or a Catechism paragraph (e.g. 1324)' : show.programme ? 'Day number or topic' : 'Search these episodes'} aria-label="Search episodes" style={{ width: '100%', marginBottom: 8 }} />
          {filtered.length === 0 && <div className="empty">Nothing here{view === 'queue' ? ': add episodes to your queue from any list.' : '.'}</div>}
          <ul className="list">
            {filtered.slice(0, 400).map((e) => <Row key={e.id} e={e} show={show} progress={doneMap.get(e.id)} inQueue={queue.some((x) => x.episodeId === e.id)} />)}
          </ul>
          {filtered.length > 400 && <p className="muted small">Showing the first 400; narrow with search.</p>}
          {!show.programme && <p className="muted small">Showing the latest {data.episodes.length} of {data.meta.total} episodes in the feed. Older ones are on the publisher’s page.</p>}
        </>
      )}
    </section>
  );
}

function Row({ e, show, progress, inQueue }: { e: BiayEpisode; show: Show; progress?: { completed: boolean; position: number; duration?: number }; inQueue: boolean }) {
  const player = usePlayer();
  const pct = progress && progress.duration ? Math.round((100 * progress.position) / progress.duration) : 0;
  const toggleQueue = async () => { if (inQueue) await db.queue.where('episodeId').equals(e.id).delete(); else await db.queue.add({ episodeId: e.id, order: Date.now() }); };
  const toggleDone = () => db.episodeProgress.put({ episodeId: e.id, position: 0, completed: !progress?.completed, updatedAt: Date.now(), duration: progress?.duration });
  return (
    <li>
      <div className="row between">
        <div style={{ minWidth: 0, flex: 1 }}>
          <a href={e.page} target="_blank" rel="noreferrer noopener" className="t" style={{ fontWeight: 600 }}>{e.title}</a>
          <div className="muted small">{e.date}{e.duration ? ` · ${fmtDuration(e.duration)}` : ''}{progress?.completed ? ' · ✓ completed' : pct > 0 ? ` · ${pct}%` : ''}</div>
          {e.ccc && e.ccc.length > 0 && <div className="chips" style={{ marginTop: 4 }}>{e.ccc.slice(0, 3).map(([a, b]) => <Link key={`${a}-${b}`} className="chip" to={`/study/catechism/${a}`}>CCC {a}{b !== a ? `–${b}` : ''}</Link>)}</div>}
          {e.description && <div className="muted small clamp2">{e.description.slice(0, 180)}{e.description.length > 180 ? '…' : ''}</div>}
        </div>
        <div className="row">
          <button className="icon-btn" onClick={() => player.play(e)} aria-label={`Play ${e.title}`}><Icon name="play" /></button>
          <button className="icon-btn" aria-pressed={inQueue} onClick={toggleQueue} aria-label={inQueue ? 'Remove from queue' : 'Add to queue'}><Icon name="queue" /></button>
          <button className="icon-btn" aria-pressed={!!progress?.completed} onClick={toggleDone} aria-label={progress?.completed ? 'Mark not completed' : 'Mark completed'}><Icon name="check" /></button>
        </div>
      </div>
      <span className="visually-hidden">{show.title}</span>
    </li>
  );
}
