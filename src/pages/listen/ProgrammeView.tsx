import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { usePlayer } from '../../data/PlayerContext';
import { loadShow, lookupEpisode, type Show, type ShowData } from '../../data/podcasts';
import type { BiayEpisode } from '../../data/content';
import { fold } from '../../search/engine';
import Icon from '../../components/Icon';
import Menu, { type MenuItem } from '../../components/Menu';
import ShowSettings from '../../components/ShowSettings';
import { toggleFollow, useFollows } from '../../lib/follow';
import { useLocalFlag } from '../../lib/localFlag';
import EpisodeRow from './EpisodeRow';

type View = 'next' | 'plan' | 'queue' | 'progress';
const HIDE_KEY = 'sb:biay:hidedone';
const fitRows = () => (typeof window === 'undefined' ? 3 : Math.max(3, Math.floor((window.innerHeight - 300) / 125)));

/** Rosary in a Year, Catechism in a Year: the same layout as the Bible in a Year, with the next episode first. */
export default function ProgrammeView({ show }: { show: Show }) {
  const player = usePlayer();
  const following = useFollows().has(show.id);
  const [data, setData] = useState<ShowData | null | undefined>(undefined);
  const [view, setView] = useState<View>('next');
  const [q, setQ] = useState('');
  const [cfg, setCfg] = useState(false);
  const [shown, setShown] = useState(fitRows);
  const [hideDone, setHideDone] = useLocalFlag(HIDE_KEY, true);
  const [today, setToday] = useLocalFlag(`sb:year:today:${show.id}`, false);
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const doneMap = useMemo(() => new Map(progress.map((p) => [p.episodeId, p])), [progress]);
  useEffect(() => { setData(undefined); setView('next'); setQ(''); loadShow(show.id).then(setData).catch(() => setData(null)); }, [show.id]);

  const days = useMemo(() => {
    if (!data) return [] as BiayEpisode[];
    const byDay = new Map<number, BiayEpisode>();
    for (const e of data.episodes) if (e.day && (!byDay.has(e.day) || (e.year ?? 0) > (byDay.get(e.day)!.year ?? 0))) byDay.set(e.day, e);
    return [...byDay.keys()].sort((a, b) => a - b).map((d) => byDay.get(d)!);
  }, [data]);
  const finished = useMemo(() => new Set(progress.filter((p) => p.completed).map((p) => p.episodeId)), [progress]);
  const list = useMemo(() => {
    if (view === 'queue') return queue.map((x) => lookupEpisode(x.episodeId)).filter(Boolean) as BiayEpisode[];
    if (view === 'progress') return progress.filter((p) => p.completed || p.position > 0).sort((a, b) => b.updatedAt - a.updatedAt).map((p) => lookupEpisode(p.episodeId)).filter((e): e is BiayEpisode => !!e && e.id.startsWith(`pod-${show.id}-`));
    const s = q.trim();
    if (!s) return hideDone ? days.filter((e) => !finished.has(e.id)) : days;
    const num = /^(?:day\s*)?(\d{1,3})$/i.exec(s);
    const ccc = /^(?:ccc\s*|§\s*)?(\d{1,4})$/i.exec(s);
    if (ccc && show.id === 'catechism-in-a-year') { const hit = days.filter((e) => e.ccc?.some(([a, b]) => +ccc[1] >= a && +ccc[1] <= b)); if (hit.length) return hit; }
    if (num) return days.filter((e) => e.day === +num[1]);
    const f = fold(s);
    return days.filter((e) => fold(`${e.title} ${e.description}`).includes(f));
  }, [view, queue, progress, days, q, hideDone, finished, show]);

  const dayNo = (() => { const start = new Date(new Date().getFullYear(), 0, 1); return Math.floor((Date.now() - start.getTime()) / 86400000) + 1; })();
  const todaysEp = days.find((e) => e.day === dayNo);
  const menu: MenuItem[] = [
    { label: 'Hide finished episodes', on: hideDone, onClick: () => setHideDone(!hideDone) },
    { label: 'Show today’s episode by the calendar', on: today, onClick: () => setToday(!today) },
    { label: 'History', onClick: () => { setView('progress'); setShown(12); } },
    { label: 'Playback settings', onClick: () => setCfg(true) },
    { label: following ? 'Unfollow' : 'Follow', onClick: () => void toggleFollow(show.id, !following) },
  ];
  const rows = view === 'next' ? list.slice(0, shown) : list.slice(0, 400);
  return (
    <section className="year" aria-label={show.title}>
      {cfg && <ShowSettings showKey={`pod-${show.id}`} name={show.title} onClose={() => setCfg(false)} />}
      {today && todaysEp && (
        <div className="card today-ep">
          <div><span className="eyebrow">Day {todaysEp.day} of the year</span><div>{todaysEp.short}</div></div>
          <button className="btn primary" onClick={() => player.play(todaysEp)}><Icon name="play" size={14} /> Listen</button>
        </div>
      )}
      <div className="year-bar">
        <div className="seg" role="tablist" aria-label="Episodes">
          {([['next', 'Up next'], ['plan', 'All days'], ['queue', `Queue${queue.length ? ` ${queue.length}` : ''}`]] as [View, string][]).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => { setView(k); setShown(fitRows()); }}>{l}</button>
          ))}
        </div>
        <Menu items={menu} />
      </div>
      {view === 'progress' && <p className="rows-sub">History <button className="btn small ghost" onClick={() => setView('next')}>Back</button></p>}
      {view === 'plan' && <input className="year-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={show.id === 'catechism-in-a-year' ? 'Day, topic or Catechism § (1324)' : 'Day number or topic'} aria-label="Search episodes" />}
      {data === undefined && <div className="center-note">Loading episodes…</div>}
      {data === null && <div className="notice">The episode list for this show is missing.</div>}
      {data && list.length === 0 && <p className="muted small">{view === 'queue' ? 'Your queue is empty.' : finished.size > 0 ? 'Everything here is finished.' : 'Nothing found.'}</p>}
      <ul className="list">
        {rows.map((e) => <EpisodeRow key={e.id} e={e} progress={doneMap.get(e.id)} inQueue={queue.some((x) => x.episodeId === e.id)} />)}
      </ul>
      {view === 'next' && list.length > shown && <button className="btn small" onClick={() => setShown(shown + 10)}>More</button>}
    </section>
  );
}
