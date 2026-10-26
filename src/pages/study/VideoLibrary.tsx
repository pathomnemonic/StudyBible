import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getJson } from '../../data/loader';
import { embedFor } from '../../lib/embed';
import { db } from '../../db/db';
import InlinePlayer from '../../components/InlinePlayer';
import { toggleFollow, useFollows } from '../../lib/follow';
import FilterBar from '../../components/FilterBar';

interface Lib { about: string; channels: string[]; videos: [id: string, title: string, channel: number][] }
const PAGE = 40;
let cache: Promise<Lib | null> | null = null;
type View = 'all' | 'later' | 'watched';
type Sort = 'mine' | 'recent' | 'title';
/** length in seconds and upload date (yyyymmdd) for each video, filled in by scripts/videos/enrich.ts when a YouTube API key is available */
type Meta = Map<string, [number, number]>;
const ls = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const runtime = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const when = (d: number) => new Date(Math.floor(d / 10000), Math.floor((d % 10000) / 100) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
let metaCache: Promise<Meta | null> | null = null;

/**
 * Every video from the Catholic channels the app draws on. The lists come from each channel's own upload page, newest first, so
 * "recently uploaded" puts each channel's latest videos at the top, mixed across channels. Videos you play here are remembered,
 * and any video can be saved for later.
 */
export default function VideoLibrary({ embedded = false }: { embedded?: boolean }) {
  const follows = useFollows();
  const [lib, setLib] = useState<Lib | null>(null);
  const [q, setQ] = useState('');
  const [ch, setCh] = useState(-1);
  const [sort, setSort] = useState<Sort | null>(null);
  const [view, setView] = useState<View>('all');
  const [shown, setShown] = useState(PAGE);
  const [thumbs, setThumbs] = useState(() => ls('sb:vthumbs') === '1');
  const [full, setFull] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => { (metaCache ??= getJson<{ d: Record<string, [number, number]> }>('media/video_meta.json', true).then((m) => (m ? new Map(Object.entries(m.d)) : null))).then(setMeta); }, []);
  const setThumb = (on: boolean) => { setThumbs(on); try { localStorage.setItem('sb:vthumbs', on ? '1' : '0'); } catch { /* storage unavailable */ } };
  const [play, setPlay] = useState<string | null>(null);
  const hist = useLiveQuery(() => db.history.where('type').equals('video').toArray(), []) ?? [];
  const later = useLiveQuery(() => db.saved.where('type').equals('video').toArray(), []) ?? [];
  const watched = useMemo(() => new Map(hist.map((h) => [h.ref, h])), [hist]);
  const laterSet = useMemo(() => new Map(later.map((s) => [s.key.slice(6), s])), [later]);
  useEffect(() => { (cache ??= getJson<Lib>('media/video_library.json', true)).then(setLib); }, []);

  // position of each video in its channel's list, as a fraction: 0 is the newest of that channel
  const rank = useMemo(() => {
    const r = new Map<string, number>();
    if (!lib) return r;
    const n = new Map<number, number>(), seen = new Map<number, number>();
    for (const v of lib.videos) n.set(v[2], (n.get(v[2]) ?? 0) + 1);
    for (const v of lib.videos) { const i = seen.get(v[2]) ?? 0; seen.set(v[2], i + 1); r.set(v[0], i + (v[2] % 7) / 7 * 0.6); }
    return r;
  }, [lib]);
  const byId = useMemo(() => new Map((lib?.videos ?? []).map((v) => [v[0], v])), [lib]);

  const favs = useMemo(() => new Set((lib?.channels ?? []).map((c, i) => (follows.has(`vc:${c}`) ? i : -1)).filter((i) => i >= 0)), [lib, follows]);
  const eff: Sort = sort ?? (favs.size ? 'mine' : 'recent');
  // newest first: by real upload date when we have it, otherwise by position in the creator's own list (each creator's newest first)
  const byNew = useMemo(() => (a: [string, string, number], b: [string, string, number]) => {
    const da = meta?.get(a[0])?.[1] ?? 0, db_ = meta?.get(b[0])?.[1] ?? 0;
    return da || db_ ? db_ - da || (rank.get(a[0]) ?? 0) - (rank.get(b[0]) ?? 0) : (rank.get(a[0]) ?? 0) - (rank.get(b[0]) ?? 0);
  }, [meta, rank]);
  const list = useMemo(() => {
    if (!lib) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let base = lib.videos;
    if (view === 'watched') base = hist.slice().sort((a, b) => b.ts - a.ts).map((h) => byId.get(h.ref)).filter((v): v is [string, string, number] => !!v);
    else if (view === 'later') base = later.slice().sort((a, b) => b.createdAt - a.createdAt).map((s) => byId.get(s.key.slice(6))).filter((v): v is [string, string, number] => !!v);
    const out = base.filter((v) => (ch < 0 || v[2] === ch) && words.every((w) => v[1].toLowerCase().includes(w)) && !(full && meta && (meta.get(v[0])?.[0] ?? 999) < 300));
    if (view === 'all') out.sort(eff === 'title' ? (a, b) => a[1].localeCompare(b[1]) : eff === 'mine' ? (a, b) => (+favs.has(b[2]) - +favs.has(a[2])) || byNew(a, b) : byNew);
    return out;
  }, [lib, q, ch, eff, favs, view, hist, later, byId, rank, byNew, full, meta]);
  useEffect(() => setShown(PAGE), [q, ch, eff, view]);
  if (!lib) return <div className="page"><p className="muted">Loading…</p></div>;
  const counts = new Map<number, number>();
  for (const v of lib.videos) counts.set(v[2], (counts.get(v[2]) ?? 0) + 1);

  const start = async (id: string, title: string) => {
    setPlay(id);
    await db.history.where('type').equals('video').filter((h) => h.ref === id).delete();
    await db.history.add({ ts: Date.now(), type: 'video', ref: id, label: title });
  };
  const toggleLater = async (id: string, title: string) => {
    const hit = laterSet.get(id);
    if (hit) await db.saved.delete(hit.id!);
    else await db.saved.add({ key: `video:${id}`, type: 'video', label: title, url: `https://www.youtube.com/watch?v=${id}`, createdAt: Date.now() } as never).catch(() => undefined);
  };
  const forget = (id: string) => db.history.where('type').equals('video').filter((h) => h.ref === id).delete();
  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && <h1>Catholic video library</h1>}
      {!embedded && <p className="lede">{lib.videos.length.toLocaleString()} videos from {lib.channels.length} Catholic channels. They play here through YouTube’s own player, or open on YouTube if the creator turned embedding off.</p>}
      <div className="tabbar" role="tablist">
        <button role="tab" aria-selected={view === 'all'} onClick={() => setView('all')}>Library</button>
        <button role="tab" aria-selected={view === 'later'} onClick={() => setView('later')}>Watch later ({later.length})</button>
        <button role="tab" aria-selected={view === 'watched'} onClick={() => setView('watched')}>Watched ({hist.length})</button>
      </div>
      <FilterBar
        active={(ch >= 0 ? 1 : 0) + (full ? 1 : 0) + (sort ? 1 : 0)}
        search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles: Eucharist, Genesis, purgatory…" aria-label="Search videos" />}
      >
        <label>Creator
          <select value={ch} onChange={(e) => setCh(+e.target.value)} aria-label="Creator">
            <option value={-1}>All creators</option>
            {lib.channels.map((c, i) => <option key={c} value={i}>{c} ({counts.get(i) ?? 0})</option>)}
          </select>
        </label>
        {ch >= 0 && <button className="btn small" aria-pressed={follows.has(`vc:${lib.channels[ch]}`)} onClick={() => toggleFollow(`vc:${lib.channels[ch]}`, !follows.has(`vc:${lib.channels[ch]}`))}>{follows.has(`vc:${lib.channels[ch]}`) ? '★ Favorite creator' : '☆ Make a favorite'}</button>}
        {view === 'all' && <label>Order
          <select value={eff} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Order">
            {favs.size > 0 && <option value="mine">My creators first</option>}
            <option value="recent">{meta ? 'Newest first' : 'Newest from each creator'}</option>
            <option value="title">Title A to Z</option>
          </select>
        </label>}
        <label className="row small" style={{ gap: 8 }}><input type="checkbox" checked={thumbs} onChange={(e) => setThumb(e.target.checked)} /> <span>Show thumbnails</span></label>
        <label className="row small" style={{ gap: 8, opacity: meta ? 1 : 0.55 }}><input type="checkbox" checked={full} disabled={!meta} onChange={(e) => setFull(e.target.checked)} /> <span>Only full-length (5 minutes or more){meta ? '' : ' · lengths not loaded yet'}</span></label>
      </FilterBar>
      <div className="row between"><p className="muted small">{list.length.toLocaleString()} videos</p>{view === 'watched' && hist.length > 0 && <button className="btn small" onClick={() => confirm('Clear your watched list?') && db.history.where('type').equals('video').delete()}>Clear watched list</button>}</div>
      {list.length === 0 && view !== 'all' && <div className="empty">{view === 'later' ? 'Nothing saved yet. Use “Watch later” on any video.' : 'Videos you play here will be listed here.'}</div>}
      <ul className="vid-list">
        {list.slice(0, shown).map(([id, title, c]) => {
          const e = embedFor(`https://www.youtube.com/watch?v=${id}`);
          const w = watched.get(id);
          const m0 = meta?.get(id); const m = m0 && m0[0] > 0 ? m0 : undefined;
          return (
            <li key={id} className={`vid${w ? ' seen' : ''}`}>
              {thumbs && <button className="vid-thumb" onClick={() => start(id, title)} aria-label={`Play ${title}`}><img loading="lazy" decoding="async" src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" />{m && <span className="vid-len">{runtime(m[0])}</span>}</button>}
              <div className="vid-main">
                <strong className="vid-title">{title}</strong>
                <div className="vid-meta">
                  <span>{lib.channels[c]}</span>
                  {m && !thumbs && <span className={`vid-pill${m[0] <= 60 ? ' short' : ''}`}>{m[0] <= 60 ? 'Short · ' : ''}{runtime(m[0])}</span>}
                  {m && m[0] <= 60 && thumbs && <span className="vid-pill short">Short</span>}
                  {m && m[1] > 0 && <span>{when(m[1])}</span>}
                  {w && <span>✓ watched</span>}
                </div>
                {play === id && e ? <InlinePlayer embed={e} title={title} /> : (
                  <div className="vid-acts">
                    <button className="btn small primary" onClick={() => start(id, title)}>▶ Play</button>
                    <button className="btn small ghost" aria-pressed={laterSet.has(id)} onClick={() => toggleLater(id, title)}>{laterSet.has(id) ? '✓ Saved' : '+ Later'}</button>
                    <details className="act-more"><summary className="btn small ghost" aria-label="More">⋯</summary>
                      <div className="act-more-list">
                        <a className="btn small ghost" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer" onClick={() => start(id, title)}>Open on YouTube ↗</a>
                        {w ? <button className="btn small ghost" onClick={() => forget(id)}>Remove from watched</button> : <button className="btn small ghost" onClick={() => db.history.add({ ts: Date.now(), type: 'video', ref: id, label: title })}>Mark watched</button>}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {list.length > shown && <button className="btn" style={{ marginTop: 12 }} onClick={() => setShown(shown + PAGE)}>Show more</button>}
    </div>
  );
}
