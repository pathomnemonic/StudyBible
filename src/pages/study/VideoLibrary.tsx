import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getJson } from '../../data/loader';
import { embedFor } from '../../lib/embed';
import { db } from '../../db/db';
import InlinePlayer from '../../components/InlinePlayer';

interface Lib { about: string; channels: string[]; videos: [id: string, title: string, channel: number][] }
const PAGE = 40;
let cache: Promise<Lib | null> | null = null;
type View = 'all' | 'later' | 'watched';
type Sort = 'recent' | 'title';

/**
 * Every video from the Catholic channels the app draws on. The lists come from each channel's own upload page, newest first, so
 * "recently uploaded" puts each channel's latest videos at the top, mixed across channels. Videos you play here are remembered,
 * and any video can be saved for later.
 */
export default function VideoLibrary() {
  const [lib, setLib] = useState<Lib | null>(null);
  const [q, setQ] = useState('');
  const [ch, setCh] = useState(-1);
  const [sort, setSort] = useState<Sort>('recent');
  const [view, setView] = useState<View>('all');
  const [shown, setShown] = useState(PAGE);
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

  const list = useMemo(() => {
    if (!lib) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let base = lib.videos;
    if (view === 'watched') base = hist.slice().sort((a, b) => b.ts - a.ts).map((h) => byId.get(h.ref)).filter((v): v is [string, string, number] => !!v);
    else if (view === 'later') base = later.slice().sort((a, b) => b.createdAt - a.createdAt).map((s) => byId.get(s.key.slice(6))).filter((v): v is [string, string, number] => !!v);
    const out = base.filter((v) => (ch < 0 || v[2] === ch) && words.every((w) => v[1].toLowerCase().includes(w)));
    if (view === 'all') out.sort(sort === 'title' ? (a, b) => a[1].localeCompare(b[1]) : (a, b) => (rank.get(a[0]) ?? 0) - (rank.get(b[0]) ?? 0));
    return out;
  }, [lib, q, ch, sort, view, hist, later, byId, rank]);
  useEffect(() => setShown(PAGE), [q, ch, sort, view]);
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
    <div className="page">
      <h1>Catholic video library</h1>
      <p className="lede">{lib.videos.length.toLocaleString()} videos from {lib.channels.length} Catholic channels: Catholic Answers, Catholic Productions, the St. Paul Center, Bishop Barron, Ascension, Jimmy Akin, Trent Horn and more. They play here through YouTube’s own player, or open on YouTube if the creator turned embedding off.</p>
      <div className="tabbar" role="tablist">
        <button role="tab" aria-selected={view === 'all'} onClick={() => setView('all')}>Library</button>
        <button role="tab" aria-selected={view === 'later'} onClick={() => setView('later')}>Watch later ({later.length})</button>
        <button role="tab" aria-selected={view === 'watched'} onClick={() => setView('watched')}>Watched ({hist.length})</button>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles: Eucharist, Genesis, purgatory…" aria-label="Search videos" style={{ flex: '1 1 240px' }} />
        <select value={ch} onChange={(e) => setCh(+e.target.value)} aria-label="Creator">
          <option value={-1}>All creators</option>
          {lib.channels.map((c, i) => <option key={c} value={i}>{c} ({counts.get(i) ?? 0})</option>)}
        </select>
        {view === 'all' && <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort"><option value="recent">Recently uploaded</option><option value="title">Title A to Z</option></select>}
      </div>
      <div className="row between"><p className="muted small">{list.length.toLocaleString()} videos</p>{view === 'watched' && hist.length > 0 && <button className="btn small" onClick={() => confirm('Clear your watched list?') && db.history.where('type').equals('video').delete()}>Clear watched list</button>}</div>
      {list.length === 0 && view !== 'all' && <div className="empty">{view === 'later' ? 'Nothing saved yet. Use “Watch later” on any video.' : 'Videos you play here will be listed here.'}</div>}
      <ul className="plain" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {list.slice(0, shown).map(([id, title, c]) => {
          const e = embedFor(`https://www.youtube.com/watch?v=${id}`);
          const w = watched.get(id);
          return (
            <li key={id} className="card" style={{ padding: 10 }}>
              <div><strong>{title}</strong></div>
              <div className="muted small">{lib.channels[c]}{w ? ` · ✓ watched ${new Date(w.ts).toLocaleDateString()}` : ''}</div>
              {play === id && e ? <InlinePlayer embed={e} title={title} /> : (
                <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <button className="btn small" onClick={() => start(id, title)}>▶ Play here</button>
                  <a className="btn small ghost" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer" onClick={() => start(id, title)}>Open on YouTube ↗</a>
                </div>
              )}
              <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <button className="btn small ghost" aria-pressed={laterSet.has(id)} onClick={() => toggleLater(id, title)}>{laterSet.has(id) ? '✓ Saved for later' : '+ Watch later'}</button>
                {w ? <button className="btn small ghost" onClick={() => forget(id)}>Remove from watched</button> : <button className="btn small ghost" onClick={() => db.history.add({ ts: Date.now(), type: 'video', ref: id, label: title })}>Mark watched</button>}
              </div>
            </li>
          );
        })}
      </ul>
      {list.length > shown && <button className="btn" style={{ marginTop: 12 }} onClick={() => setShown(shown + PAGE)}>Show more</button>}
    </div>
  );
}
