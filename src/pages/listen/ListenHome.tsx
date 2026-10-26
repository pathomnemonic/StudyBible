import FilterBar from '../../components/FilterBar';
import { HubHeader } from '../../components/Hub';
import SaveOffline from '../../components/SaveOffline';
import { useMemo, useState } from 'react';
import { Tip, StartHere } from '../../components/Hints';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration, useBiay } from '../../data/biay';
import { rememberEpisode, usePlayer } from '../../data/PlayerContext';
import { formatRef, parseRefId, parseRefs, refsOverlap } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import Icon from '../../components/Icon';
import type { BiayEpisode } from '../../data/content';
import { fold } from '../../search/engine';
import MyMedia from '../../components/MyMedia';
import Meditate from './Meditate';
import YearHero from '../../components/YearHero';
import { RecordedList } from '../../components/RecordedBooks';
import PodcastView from './PodcastView';
import ForYou from './ForYou';
import VideoLibrary from '../study/VideoLibrary';
import PodcastLibrary from './PodcastLibrary';
import Audiobooks from './Audiobooks';
import { useShows } from '../../data/podcasts';
import { useSettings } from '../../lib/store';

type View = 'plan' | 'release' | 'queue' | 'progress';

function BiayListen() {
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
    <div>
      <YearHero />
      <h2 className="h-sm" style={{ marginTop: 22 }}>Every day</h2>

      <div className="tabbar" role="tablist">
        {([['plan', 'The plan'], ['release', 'All episodes'], ['queue', `Queue (${queue.length})`], ['progress', 'My progress']] as [View, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <FilterBar active={year ? 1 : 0}
        search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Day, title or passage (92, Hezekiah, John 6)" aria-label="Search episodes" />}>
        <label>Release<select value={year} onChange={(e) => setYear(e.target.value ? +e.target.value : '')} aria-label="Release year">
          <option value="">Latest release</option>
          {years.map((y) => <option key={y} value={y}>{y} release</option>)}
        </select></label>
      </FilterBar>
      {view === 'plan' && <p className="muted small">365 days through the whole Bible. Type a passage to find its episode.</p>}
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
      <RecordedList />
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
    else { void rememberEpisode(e); await db.queue.add({ episodeId: e.id, order: Date.now() }); }
  };
  const toggleDone = () => { void rememberEpisode(e); return db.episodeProgress.put({ episodeId: e.id, position: 0, completed: !progress?.completed, updatedAt: Date.now(), duration: progress?.duration }); };
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
          <SaveOffline ep={e} compact />
          <button className="icon-btn" aria-pressed={inQueue} onClick={toggleQueue} aria-label={inQueue ? 'Remove from queue' : 'Add to queue'}><Icon name="queue" /></button>
          <button className="icon-btn" aria-pressed={!!progress?.completed} onClick={toggleDone} aria-label={progress?.completed ? 'Mark not completed' : 'Mark completed'}><Icon name="check" /></button>
        </div>
      </div>
    </li>
  );
}

type Tab = 'now' | 'podcasts' | 'audiobooks' | 'programmes' | 'videos' | 'meditate';
const TABS: [Tab, string][] = [['programmes', 'Bible in a Year'], ['now', 'For you'], ['podcasts', 'Podcasts'], ['audiobooks', 'Audiobooks'], ['videos', 'Videos'], ['meditate', 'Meditate']];

/** The Media tab: the Bible in a Year first, then what you follow, podcasts, audiobooks and videos. */
export default function ListenHome() {
  const shows = useShows();
  const [sp, setSp] = useSearchParams();
  const hashShow = (() => { try { return new URLSearchParams(location.hash.split('?')[1] ?? '').get('show'); } catch { return null; } })();
  const wanted = sp.get('show') ?? hashShow;
  const tabParam = sp.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.some((t) => t[0] === tabParam) ? tabParam : wanted && wanted !== 'biay' ? 'podcasts' : 'programmes';
  const go = (t: Tab, extra: Record<string, string> = {}) => setSp({ tab: t, ...extra }, { replace: true });
  const openId = tab === 'podcasts' ? sp.get('show') ?? (wanted && wanted !== 'biay' ? wanted : '') : '';
  const open = shows?.find((x) => x.id === openId);
  return (
    <div className="page media">
      <HubHeader title="Media" />
      <div className="tabbar" role="tablist" aria-label="Media">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}>{l}</button>)}
      </div>
      {tab === 'now' && <ForYou />}
      {tab === 'videos' && <VideoLibrary embedded />}
      {tab === 'meditate' && <Meditate />}
      {tab === 'podcasts' && (open
        ? <><button className="linklike small" onClick={() => go('podcasts')}>← All podcasts</button><PodcastView show={open} /></>
        : <PodcastLibrary onOpen={(id) => go('podcasts', { show: id })} />)}
      {tab === 'audiobooks' && <Audiobooks />}
      {tab === 'programmes' && <div className="embedded-listen"><BiayListen /></div>}
    </div>
  );
}
