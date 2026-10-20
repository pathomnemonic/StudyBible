import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration, useBiay } from '../../data/biay';
import { usePlayer } from '../../data/PlayerContext';
import { formatRef, parseRefId, parseRefs, refsOverlap } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import Icon from '../../components/Icon';
import type { BiayEpisode } from '../../data/content';
import { fold } from '../../search/engine';
import MyMedia from '../../components/MyMedia';
import YearHero from '../../components/YearHero';

type View = 'plan' | 'release' | 'queue' | 'progress';

export default function ListenHome() {
  const { biay, loaded } = useBiay();
  const player = usePlayer();
  const [view, setView] = useState<View>('plan');
  const [q, setQ] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const planStart = useLiveQuery(() => db.planProgress.get('biay'), []);
  const doneMap = useMemo(() => new Map(progress.map((p) => [p.episodeId, p])), [progress]);

  const epsFor = useMemo(() => {
    if (!biay) return [] as BiayEpisode[];
    const pick = (d: number) => (year ? biay.releases.get(d)?.find((e) => e.year === year) ?? biay.dayEpisode.get(d) : biay.dayEpisode.get(d));
    const days = [...biay.dayEpisode.keys()].sort((a, b) => a - b).map((d) => pick(d)!).filter(Boolean);
    if (view === 'plan') return days;
    if (view === 'release') return [...biay.data.episodes].filter((e) => !year || e.year === year).sort((a, b) => b.date.localeCompare(a.date));
    if (view === 'queue') return queue.map((x) => biay.byId.get(x.episodeId)).filter(Boolean) as BiayEpisode[];
    return progress.filter((p) => p.completed || p.position > 0).sort((a, b) => b.updatedAt - a.updatedAt).map((p) => biay.byId.get(p.episodeId)).filter(Boolean) as BiayEpisode[];
  }, [biay, view, year, queue, progress]);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return epsFor;
    const num = /^(?:day\s*)?(\d{1,3})$/i.exec(s);
    if (num) return epsFor.filter((e) => e.day === +num[1]);
    const pr = parseRefs(s);
    if (pr.ok) {
      // typed passages are read in modern numbering, as the show uses
      const anchors = pr.refs.map(({ ref }) => convertRef('kjv', 'vulgate', ref).ref);
      return epsFor.filter((e) => e.passages.some((p) => { const r = parseRefId(p); return r && anchors.some((a) => refsOverlap(a, r)); }));
    }
    const f = fold(s);
    return epsFor.filter((e) => fold(e.title + ' ' + e.description).includes(f));
  }, [epsFor, q]);

  if (!loaded) return <div className="center-note">Loading episodes…</div>;
  if (!biay) return <div className="center-note">Episode data is missing. Run <code>npm run data:all</code>.</div>;

  const startPlan = () => db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 });
  const todayDay = planStart ? Math.min(365, Math.max(1, Math.floor((Date.now() - planStart.startedAt) / 86400000) + 1 + planStart.offsetDays)) : null;
  const todayEp = todayDay ? biay.dayEpisode.get(todayDay) : null;
  const resumeId = progress.filter((p) => !p.completed && p.position > 30).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const resumeEp = resumeId ? biay.byId.get(resumeId.episodeId) : null;
  const years = [...new Set(biay.data.episodes.map((e) => e.year).filter(Boolean) as number[])].sort();

  return (
    <div className="page">
      <h1>Bible in a Year</h1>
      <p className="lede">The Bible in a Year with Fr. Mike Schmitz, mapped to the passages each day reads. Audio and video belong to Ascension; this app links to the originals and plays the publisher’s own feed.</p>

      <YearHero />
      {resumeEp && (
        <div className="card" style={{ margin: '14px 0' }}>
          <h2 className="card-title">Pick up where you stopped</h2>
          <p style={{ margin: '0 0 8px' }}>{resumeEp.title}</p>
          <button className="btn primary" onClick={() => player.play(resumeEp)}><Icon name="play" size={16} /> Continue at {Math.floor(resumeId!.position / 60)} min</button>
        </div>
      )}
      <h2 className="h-sm">Every day</h2>

      <div className="tabbar" role="tablist">
        {([['plan', 'The plan'], ['release', 'All episodes'], ['queue', `Queue (${queue.length})`], ['progress', 'My progress']] as [View, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Day number, title, or passage (e.g. 92, Hezekiah, John 6)" aria-label="Search episodes" style={{ flex: 1, minWidth: 200 }} />
        <select value={year} onChange={(e) => setYear(e.target.value ? +e.target.value : '')} aria-label="Release year">
          <option value="">Latest release</option>
          {years.map((y) => <option key={y} value={y}>{y} release</option>)}
        </select>
      </div>
      {view === 'plan' && <p className="muted small">The plan reads the whole Bible in 365 days (Day 1–365), mixing the Old Testament, the New Testament and the Psalms or Proverbs each day. To find the episode for a passage, type it in the search box (for example “Romans 8”), or open any chapter in the Bible tab: its episode is at the top.</p>}
      {filtered.length === 0 && <div className="empty">No episodes here{view === 'queue' ? ' — add episodes to your queue from any list.' : '.'}</div>}
      <ul className="list">
        {filtered.slice(0, 400).map((e) => <Row key={e.id} e={e} progress={doneMap.get(e.id)} inQueue={queue.some((x) => x.episodeId === e.id)} />)}
      </ul>
      {filtered.length > 400 && <p className="muted small">Showing the first 400; narrow with search.</p>}
      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Hear Scripture read aloud</h2>
        <p className="muted small">
          In the Read tab, tap <strong>Read aloud</strong> (the headphones icon) to have any chapter read with your device’s speech voices: highlight follows the verse, with speed, voice and skip controls, and it can continue into the next chapter. This is synthesized speech, not a human recording.
          For recorded readings of public-domain Bibles, volunteer recordings are published by <a href="https://librivox.org/" target="_blank" rel="noreferrer">LibriVox</a> (search for the Douay-Rheims or World English Bible); add any recording’s page or audio file to the media queue below to play it here.
        </p>
      </section>
      <MyMedia />
      <div className="notice info">
        Official sources: <a href={biay.data.meta.page} target="_blank" rel="noreferrer">podcast page</a> · <a href={biay.data.meta.home} target="_blank" rel="noreferrer">Ascension reading plan</a> · <a href="https://www.youtube.com/@AscensionPresents" target="_blank" rel="noreferrer">Ascension Presents on YouTube</a>. Transcripts are not published in the official feed, so none are shown. Passage lists come from the feed metadata (voted across yearly re-releases) and may be corrected by reviewers in <code>data/curated/biay-overrides.json</code>.
      </div>
    </div>
  );
}

function Row({ e, progress, inQueue }: { e: BiayEpisode; progress?: { completed: boolean; position: number; duration?: number }; inQueue: boolean }) {
  const player = usePlayer();
  const pct = progress && progress.duration ? Math.round((100 * progress.position) / progress.duration) : 0;
  const toggleQueue = async () => {
    if (inQueue) await db.queue.where('episodeId').equals(e.id).delete();
    else await db.queue.add({ episodeId: e.id, order: Date.now() });
  };
  const toggleDone = () => db.episodeProgress.put({ episodeId: e.id, position: 0, completed: !progress?.completed, updatedAt: Date.now(), duration: progress?.duration });
  return (
    <li>
      <div className="row between">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link to={`/listen/episode/${e.id}`} className="t" style={{ fontWeight: 600 }}>{e.kind === 'day' ? `Day ${e.day}: ${e.short}` : e.title}</Link>
          <div className="muted small">{e.date} · {fmtDuration(e.duration)}{e.year ? ` · ${e.year} release` : ''}{progress?.completed ? ' · ✓ completed' : pct > 0 ? ` · ${pct}%` : ''}</div>
          <div className="chips" style={{ marginTop: 4 }}>
            {e.passages.slice(0, 6).map((p) => { const r = parseRefId(p); return r ? <span key={p} className="chip">{formatRef(r, { abbr: true })}</span> : null; })}
            {e.passages.length === 0 && e.kind === 'day' && <span className="chip warn">passages not in feed — needs review</span>}
          </div>
        </div>
        <div className="row">
          <button className="icon-btn" onClick={() => player.play(e)} aria-label={`Play ${e.title}`}><Icon name="play" /></button>
          <button className="icon-btn" aria-pressed={inQueue} onClick={toggleQueue} aria-label={inQueue ? 'Remove from queue' : 'Add to queue'}><Icon name="queue" /></button>
          <button className="icon-btn" aria-pressed={!!progress?.completed} onClick={toggleDone} aria-label={progress?.completed ? 'Mark not completed' : 'Mark completed'}><Icon name="check" /></button>
        </div>
      </div>
    </li>
  );
}
