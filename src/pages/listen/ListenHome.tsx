import FilterBar from '../../components/FilterBar';
import { HubHeader } from '../../components/Hub';
import SaveOffline from '../../components/SaveOffline';
import { useMemo, useState, useEffect } from 'react';
import { Tip, StartHere } from '../../components/Hints';
import RefLink from '../../components/RefLink';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { fmtDuration, useBiay } from '../../data/biay';
import { rememberEpisode, resolveEpisode, usePlayer } from '../../data/PlayerContext';
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

type View = 'next' | 'plan' | 'extras' | 'queue' | 'progress';
const HIDE_KEY = 'sb:biay:hidedone';
const loadHide = () => { try { return localStorage.getItem(HIDE_KEY) !== '0'; } catch { return true; } };

function BiayListen() {
  const { biay, loaded } = useBiay();
  const player = usePlayer();
  const [view, setView] = useState<View>('next');
  const [hideDone, setHideDone] = useState(loadHide);
  const [shown, setShown] = useState(12);
  const [bulk, setBulk] = useState(false);
  const [upTo, setUpTo] = useState('');
  const [q, setQ] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const progress = useLiveQuery(() => db.episodeProgress.toArray(), []) ?? [];
  const queue = useLiveQuery(() => db.queue.orderBy('order').toArray(), []) ?? [];
  const planStart = useLiveQuery(() => db.planProgress.get('biay'), []);
  // the queue and progress hold episodes from any show (podcasts, audiobooks, meditation), not only this plan
  const [other, setOther] = useState<Record<string, BiayEpisode>>({});
  const wantIds = (view === 'queue' ? queue.map((x) => x.episodeId) : view === 'progress' ? progress.filter((p) => p.completed || p.position > 0).map((p) => p.episodeId) : []).join(',');
  useEffect(() => { let live = true; void Promise.all(wantIds.split(',').filter(Boolean).map(async (id) => [id, await resolveEpisode(id)] as const)).then((r) => live && setOther(Object.fromEntries(r.filter((x): x is [string, BiayEpisode] => !!x[1])))); return () => { live = false; }; }, [wantIds]);
  const doneMap = useMemo(() => new Map(progress.map((p) => [p.episodeId, p])), [progress]);

  const epsFor = useMemo(() => {
    if (!biay) return [] as BiayEpisode[];
    const pick = (d: number) => (year ? biay.releases.get(d)?.find((e) => e.year === year) ?? biay.dayEpisode.get(d) : biay.dayEpisode.get(d));
    const days = [...biay.dayEpisode.keys()].sort((a, b) => a - b).map((d) => pick(d)!).filter(Boolean);
    if (view === 'plan' || view === 'next') return days;
    if (view === 'extras') return [...biay.data.episodes].filter((e) => e.kind !== 'day' && (!year || e.year === year)).sort((a, b) => b.date.localeCompare(a.date));
    if (view === 'queue') return queue.map((x) => biay.byId.get(x.episodeId) ?? other[x.episodeId]).filter(Boolean) as BiayEpisode[];
    return progress.filter((p) => p.completed || p.position > 0).sort((a, b) => b.updatedAt - a.updatedAt).map((p) => biay.byId.get(p.episodeId) ?? other[p.episodeId]).filter(Boolean) as BiayEpisode[];
  }, [biay, view, year, queue, progress, other]);

  const finishedIds = useMemo(() => new Set(progress.filter((p) => p.completed).map((p) => p.episodeId)), [progress]);
  const filtered = useMemo(() => {
    const s = q.trim();
    // finished episodes are tucked away (unless you are searching for one), so the list starts at where you are
    const base = !s && hideDone && (view === 'next' || view === 'plan' || view === 'extras') ? epsFor.filter((e) => !finishedIds.has(e.id)) : epsFor;
    if (!s) return base;
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
  }, [epsFor, q, hideDone, view, finishedIds]);

  if (!loaded) return <div className="center-note">Loading episodes…</div>;
  if (!biay) return <div className="center-note">Episode data is missing. Run <code>npm run data:all</code>.</div>;

  /** Marks days 1..n finished (every release's episode for each day) and moves the plan to day n+1. */
  const markThrough = async (n: number) => {
    const rows = [];
    for (let d = 1; d <= n; d++) for (const e of biay.releases.get(d) ?? [biay.dayEpisode.get(d)].filter(Boolean) as BiayEpisode[]) rows.push({ episodeId: e.id, position: 0, completed: true, updatedAt: Date.now(), duration: e.duration ?? undefined });
    await db.episodeProgress.bulkPut(rows);
    const cur = await db.planProgress.get('biay');
    const done = [...new Set([...(cur?.done ?? []), ...Array.from({ length: n }, (_, i) => i)])];
    await db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done, offsetDays: n });
    setBulk(false); setUpTo('');
  };
  const clearFinished = async () => {
    if (!confirm('Clear every finished mark on these episodes? Your queue and listening position are kept.')) return;
    const ids = progress.filter((p) => p.completed).map((p) => p.episodeId);
    await db.episodeProgress.where('episodeId').anyOf(ids).modify({ completed: false });
  };
  const todayDay = planStart ? Math.min(365, Math.max(1, Math.floor((Date.now() - planStart.startedAt) / 86400000) + 1 + planStart.offsetDays)) : null;
  const todayEp = todayDay ? biay.dayEpisode.get(todayDay) : null;
  const resumeId = progress.filter((p) => !p.completed && p.position > 30).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const resumeEp = resumeId ? biay.byId.get(resumeId.episodeId) : null;
  const years = [...new Set(biay.data.episodes.map((e) => e.year).filter(Boolean) as number[])].sort();

  return (
    <div>
      <YearHero />
      <h2 className="h-sm" style={{ marginTop: 22 }}>Episodes</h2>

      <div className="tabbar" role="tablist">
        {([['next', 'Up next'], ['plan', 'All 365 days'], ['extras', 'Extras'], ['queue', `Queue ${queue.length}`], ['progress', 'History']] as [View, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => { setView(k); setShown(12); }}>{l}</button>
        ))}
      </div>
      {(view === 'plan' || view === 'extras') && (
        <FilterBar active={year ? 1 : 0}
          search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Day, title or passage (92, Hezekiah, John 6)" aria-label="Search episodes" />}>
          <label>Release<select value={year} onChange={(e) => setYear(e.target.value ? +e.target.value : '')} aria-label="Release year">
            <option value="">Latest release</option>
            {years.map((y) => <option key={y} value={y}>{y} release</option>)}
          </select></label>
        </FilterBar>
      )}
      {view === 'next' && <p className="muted small" style={{ margin: '6px 0' }}>Your next unfinished days, in order. {finishedIds.size > 0 ? `${finishedIds.size} finished ${finishedIds.size === 1 ? 'episode is' : 'episodes are'} tucked away.` : 'Mark an episode finished with the ✓ and it moves out of the way.'}</p>}
      {view === 'plan' && <p className="muted small">All 365 days, through the whole Bible. Type a passage to find its episode.</p>}
      {view === 'extras' && <p className="muted small">Bonus and special episodes that are not one of the 365 days.</p>}
      {(view === 'next' || view === 'plan' || view === 'extras') && (
        <div className="row" style={{ gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <label className="row small" style={{ gap: 6 }}>
            <input type="checkbox" checked={hideDone} onChange={(e) => { setHideDone(e.target.checked); try { localStorage.setItem(HIDE_KEY, e.target.checked ? '1' : '0'); } catch { /* private mode */ } }} /> Hide finished episodes
          </label>
          {(view === 'next' || view === 'plan') && <button className="linklike small" onClick={() => setBulk(!bulk)} aria-expanded={bulk}>Coming from another app?</button>}
        </div>
      )}
      {bulk && (
        <section className="card" aria-label="Catch up">
          <strong>Already listening somewhere else?</strong>
          <p className="muted small" style={{ margin: '4px 0 8px' }}>Tell us how far you got and every earlier day is marked finished and tucked away, so the list starts at your next episode. You can undo it.</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <label className="row small" style={{ gap: 6 }}>I have finished through day
              <input type="number" min={1} max={365} value={upTo} onChange={(e) => setUpTo(e.target.value)} style={{ width: 80 }} aria-label="Last day finished" />
            </label>
            <button className="btn primary small" disabled={!(+upTo >= 1)} onClick={() => void markThrough(Math.min(365, +upTo))}>Mark days 1 to {upTo || '…'} finished</button>
            <button className="btn small" onClick={() => void clearFinished()}>Undo all finished marks</button>
          </div>
        </section>
      )}
      {filtered.length === 0 && <div className="empty">{view === 'queue' ? 'Nothing in your queue — add episodes from any list.' : view === 'next' || view === 'plan' ? (finishedIds.size > 0 ? 'Everything here is finished. Untick “Hide finished episodes” to see them.' : 'No episodes here.') : 'No episodes here.'}</div>}
      <ul className="list">
        {(view === 'next' ? filtered.slice(0, shown) : filtered.slice(0, 400)).map((e) => <Row key={e.id} e={e} progress={doneMap.get(e.id)} inQueue={queue.some((x) => x.episodeId === e.id)} />)}
      </ul>
      {view === 'next' && filtered.length > shown && <p><button className="btn" onClick={() => setShown(shown + 20)}>Show the next 20</button> <button className="linklike small" onClick={() => setView('plan')}>or browse all days</button></p>}
      {view === 'queue' && !q && queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).length > 0 && (
        <div className="notice" role="note">
          {queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).length} items in your queue can no longer be found.{' '}
          <button className="linklike" onClick={() => void db.queue.bulkDelete(queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).map((x) => x.id!))}>Clear them</button>
        </div>
      )}
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
            {e.passages.slice(0, 6).map((p) => { const r = parseRefId(p); return r ? <RefLink key={p} refv={r}><span className="chip">{formatRef(r, { abbr: true })}</span></RefLink> : null; })}
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
const TABS: [Tab, string][] = [['programmes', 'Year'], ['now', 'For you'], ['podcasts', 'Podcasts'], ['audiobooks', 'Books'], ['videos', 'Videos'], ['meditate', 'Meditate']];

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
      <HubHeader quiet title="Media" />
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
