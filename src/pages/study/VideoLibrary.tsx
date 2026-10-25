import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../../data/loader';
import { embedFor } from '../../lib/embed';
import InlinePlayer from '../../components/InlinePlayer';

interface Lib { about: string; channels: string[]; videos: [id: string, title: string, channel: number][] }
const PAGE = 40;
let cache: Promise<Lib | null> | null = null;

/** Every video from the Catholic channels the app draws on, searchable by words in the title or by creator. Videos matched to a passage show beside it in the study panel; this page also holds the many that are about a topic but not a passage. */
export default function VideoLibrary() {
  const [lib, setLib] = useState<Lib | null>(null);
  const [q, setQ] = useState('');
  const [ch, setCh] = useState(-1);
  const [shown, setShown] = useState(PAGE);
  const [play, setPlay] = useState<string | null>(null);
  useEffect(() => { (cache ??= getJson<Lib>('media/video_library.json', true)).then(setLib); }, []);
  const list = useMemo(() => {
    if (!lib) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return lib.videos.filter((v) => (ch < 0 || v[2] === ch) && words.every((w) => v[1].toLowerCase().includes(w)));
  }, [lib, q, ch]);
  useEffect(() => setShown(PAGE), [q, ch]);
  if (!lib) return <div className="page"><p className="muted">Loading…</p></div>;
  const counts = new Map<number, number>();
  for (const v of lib.videos) counts.set(v[2], (counts.get(v[2]) ?? 0) + 1);
  return (
    <div className="page">
      <h1>Catholic video library</h1>
      <p className="lede">{lib.videos.length.toLocaleString()} videos from {lib.channels.length} Catholic channels: Catholic Answers, Catholic Productions, the St. Paul Center, Bishop Barron, Ascension, Jimmy Akin, Trent Horn and more. They play here through YouTube’s own player, or open on YouTube if the creator turned embedding off.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles: Eucharist, Genesis, purgatory…" aria-label="Search videos" style={{ flex: '1 1 240px' }} />
        <select value={ch} onChange={(e) => setCh(+e.target.value)} aria-label="Creator">
          <option value={-1}>All creators</option>
          {lib.channels.map((c, i) => <option key={c} value={i}>{c} ({counts.get(i) ?? 0})</option>)}
        </select>
      </div>
      <p className="muted small">{list.length.toLocaleString()} videos</p>
      <ul className="plain" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {list.slice(0, shown).map(([id, title, c]) => {
          const e = embedFor(`https://www.youtube.com/watch?v=${id}`);
          return (
            <li key={id} className="card" style={{ padding: 10 }}>
              <div><strong>{title}</strong></div>
              <div className="muted small">{lib.channels[c]}</div>
              {play === id && e ? <InlinePlayer embed={e} title={title} /> : (
                <div className="row" style={{ gap: 8, marginTop: 6 }}>
                  <button className="btn small" onClick={() => setPlay(id)}>▶ Play here</button>
                  <a className="btn small ghost" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Open on YouTube ↗</a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {list.length > shown && <button className="btn" style={{ marginTop: 12 }} onClick={() => setShown(shown + PAGE)}>Show more</button>}
    </div>
  );
}
