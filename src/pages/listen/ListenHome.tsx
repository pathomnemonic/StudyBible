import FilterBar from '../../components/FilterBar';
import { HubHeader } from '../../components/Hub';
import SaveOffline from '../../components/SaveOffline';
import { useMemo, useState, useEffect } from 'react';
import { Tip, StartHere } from '../../components/Hints';
import RefLink from '../../components/RefLink';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import ShowSettings from '../../components/ShowSettings';
import YearHero from '../../components/YearHero';
import { RecordedList } from '../../components/RecordedBooks';
import PodcastView from './PodcastView';
import ProgrammeView from './ProgrammeView';
import EpisodeRow from './EpisodeRow';
import { useLocalFlag } from '../../lib/localFlag';
import Menu, { type MenuItem } from '../../components/Menu';
import Fold from '../../components/Fold';
import ForYou from './ForYou';
import VideoLibrary from '../study/VideoLibrary';
import PodcastLibrary from './PodcastLibrary';
import Audiobooks from './Audiobooks';
import { useShows, type Show } from '../../data/podcasts';
import { useSettings } from '../../lib/store';
import { copyText } from '../../lib/clipboard';
import { queueLink } from '../../data/playlist';
import { NewDot } from '../../components/Hints';

type View = 'next' | 'plan' | 'extras' | 'queue' | 'progress';
const HIDE_KEY = 'sb:biay:hidedone';
const loadHide = () => { try { return localStorage.getItem(HIDE_KEY) !== '0'; } catch { return true; } };

function BiayListen() {
  const nav = useNavigate();
  const { biay, loaded } = useBiay();
  const player = usePlayer();
  const [view, setView] = useState<View>('next');
  const [hideDone, setHideDone] = useState(loadHide);
  const [showToday, setShowToday] = useLocalFlag('sb:year:today:biay', false);
  const [cfgBiay, setCfgBiay] = useState(false);
  const [shown, setShown] = useState(() => Math.max(3, Math.floor(((typeof window === "undefined" ? 800 : window.innerHeight) - 300) / 125)));
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

  const goSearch = () => nav('/listen-search');
  const menuItems: MenuItem[] = [
    { label: 'Search all media', onClick: goSearch },
    ...(queue.length ? [{ label: 'Share my queue as a link', onClick: () => void copyText(queueLink(queue.map((x) => x.episodeId))) }] : []),
    { label: 'Hide finished episodes', on: hideDone, onClick: () => { const v = !hideDone; setHideDone(v); try { localStorage.setItem(HIDE_KEY, v ? '1' : '0'); } catch { /* private mode */ } } },
    { label: 'Show today’s episode card', on: showToday, onClick: () => setShowToday(!showToday) },
    { label: 'Playback settings', onClick: () => setCfgBiay(true) },
    { label: 'Catch up: I’m already part way', onClick: () => { setView('next'); setBulk(true); } },
    { label: 'Extras', onClick: () => { setView('extras'); setShown(12); } },
    { label: 'History', onClick: () => { setView('progress'); setShown(12); } },
  ];
  const rows = view === 'next' ? filtered.slice(0, shown) : filtered.slice(0, 400);
  return (
    <div className="year">
      {showToday && <YearHero />}
      <div className="year-bar">
        <div className="seg" role="tablist" aria-label="Episodes">
          {([['next', 'Up next'], ['plan', 'All days'], ['queue', `Queue${queue.length ? ` ${queue.length}` : ''}`]] as [View, string][]).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => { setView(k); setShown(Math.max(3, Math.floor((window.innerHeight - 300) / 125))); }}>{l}</button>
          ))}
        </div>
        <Menu items={menuItems} />
      </div>
      {view === 'extras' && <p className="rows-sub">Extras <button className="btn small ghost" onClick={() => setView("next")}>Back</button></p>}
      {view === 'progress' && <p className="rows-sub">History <button className="btn small ghost" onClick={() => setView("next")}>Back</button></p>}
      {(view === 'plan' || view === 'extras') && (
        <FilterBar active={year ? 1 : 0}
          search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Day, title or passage (92, John 6)" aria-label="Search episodes" />}>
          <label>Release<select value={year} onChange={(e) => setYear(e.target.value ? +e.target.value : '')} aria-label="Release year">
            <option value="">Latest</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select></label>
        </FilterBar>
      )}
      {bulk && (
        <section className="card catchup" aria-label="Catch up">
          <label className="row small" style={{ gap: 8 }}>Finished through day
            <input type="number" min={1} max={365} value={upTo} onChange={(e) => setUpTo(e.target.value)} style={{ width: 72 }} aria-label="Last day finished" />
            <button className="btn small primary" disabled={!(+upTo >= 1)} onClick={() => void markThrough(Math.min(365, +upTo))}>Mark days 1 to {upTo || '…'} finished</button>
            <button className="btn small" onClick={() => void clearFinished()}>Undo all</button>
            <button className="btn small ghost" onClick={() => setBulk(false)}>Close</button>
          </label>
        </section>
      )}
      {filtered.length === 0 && <p className="muted small">{view === 'queue' ? 'Your queue is empty.' : view === 'next' || view === 'plan' ? (finishedIds.size > 0 ? 'Everything here is finished.' : 'Nothing found.') : 'Nothing here yet.'}</p>}
      <ul className="list">
        {rows.map((e) => <EpisodeRow page key={e.id} e={e} progress={doneMap.get(e.id)} inQueue={queue.some((x) => x.episodeId === e.id)} />)}
      </ul>
      {view === 'next' && filtered.length > shown && <button className="btn small" onClick={() => setShown(shown + 10)}>More</button>}
      {view === 'queue' && !q && queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).length > 0 && (
        <button className="linklike small" onClick={() => void db.queue.bulkDelete(queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).map((x) => x.id!))}>Clear {queue.filter((x) => !filtered.some((e) => e.id === x.episodeId)).length} missing items</button>
      )}
      {cfgBiay && <ShowSettings showKey="biay" name="Bible in a Year" onClose={() => setCfgBiay(false)} />}
      <Fold rare id="media:more" title="More audio">
        <MyMedia />
        <RecordedList />
        <p className="muted small">Read aloud: tap the headphones in any chapter. Recorded Bibles: <a href="https://librivox.org/" target="_blank" rel="noreferrer">LibriVox</a>. Sources: <a href={biay.data.meta.page} target="_blank" rel="noreferrer">podcast page</a> · <a href={biay.data.meta.home} target="_blank" rel="noreferrer">Ascension</a></p>
      </Fold>
    </div>
  );
}

type Tab = 'now' | 'podcasts' | 'audiobooks' | 'programmes' | 'videos' | 'meditate';
const PROG_KEY = 'sb:year:prog';

/** The Year tab: Bible, Catechism or Rosary in a Year, chosen from one row at the top. */
function YearTab({ shows }: { shows: Show[] | null }) {
  const [prog, setProg] = useState(() => { try { return localStorage.getItem(PROG_KEY) || 'biay'; } catch { return 'biay'; } });
  const years = (shows ?? []).filter((x) => x.programme);
  const cur = years.find((x) => x.id === prog);
  const pick = (id: string) => { setProg(id); try { localStorage.setItem(PROG_KEY, id); } catch { /* private mode */ } };
  const label = (x: Show) => x.title.replace(/^The\s+/, '').replace(/\s+in a Year$/i, '');
  return (
    <>
      {years.length > 0 && (
        <div className="seg year-pick" role="tablist" aria-label="In a Year program">
          <button role="tab" aria-selected={!cur} onClick={() => pick('biay')}>Bible</button>
          {years.map((x) => <button key={x.id} role="tab" aria-selected={cur?.id === x.id} data-seen={`m.year.${x.id}`} onClick={() => pick(x.id)}>{label(x)}<NewDot id={`m.year.${x.id}`} label={`New: ${label(x)}`} /></button>)}
        </div>
      )}
      {cur ? <ProgrammeView show={cur} /> : <BiayListen />}
    </>
  );
}

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
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} data-seen={k === 'programmes' ? undefined : `m.${k}`} onClick={() => go(k)}>{l}{k !== 'programmes' && <NewDot id={`m.${k}`} label={`New: ${l}`} />}</button>)}
      </div>
      {tab === 'now' && <ForYou />}
      {tab === 'videos' && <VideoLibrary embedded />}
      {tab === 'meditate' && <Meditate />}
      {tab === 'podcasts' && (open
        ? <><button className="btn small ghost" onClick={() => go('podcasts')}>← All podcasts</button>{open.programme ? <ProgrammeView show={open} /> : <PodcastView show={open} />}</>
        : <PodcastLibrary onOpen={(id) => go('podcasts', { show: id })} />)}
      {tab === 'audiobooks' && <Audiobooks />}
      {tab === 'programmes' && <div className="embedded-listen"><YearTab shows={shows} /></div>}
    </div>
  );
}
