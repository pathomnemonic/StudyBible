import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchMedia, type MediaHit } from '../../search/media';

const ORDER: MediaHit['kind'][] = ['Bible in a Year', 'Podcast', 'Episode', 'Audiobook', 'Video'];

/** One box for everything you can listen to or watch. */
export default function MediaSearch() {
  const [sp, setSp] = useSearchParams();
  const asked = sp.get('q') ?? '';
  const [q, setQ] = useState(asked);
  const [hits, setHits] = useState<MediaHit[] | null>(null);
  useEffect(() => {
    setQ(asked);
    if (!asked.trim()) { setHits(null); return; }
    let live = true;
    setHits(null);
    searchMedia(asked).then((h) => live && setHits(h));
    return () => { live = false; };
  }, [asked]);
  return (
    <div className="page media-search">
      <h1>Search Media</h1>
      <form className="rowform" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) setSp({ q: q.trim() }, { replace: true }); }}>
        <label className="sr-only" htmlFor="ms-q">Search episodes, podcasts, audiobooks and videos</label>
        <input id="ms-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="An episode, a show, a book or a topic" autoFocus />
        <button className="btn primary" type="submit" disabled={!q.trim()}>Search</button>
      </form>
      {asked && hits === null && <div className="center-note">Searching…</div>}
      {hits && hits.length === 0 && <p className="muted">Nothing matched “{asked}”.</p>}
      {hits && ORDER.map((k) => {
        const list = hits.filter((h) => h.kind === k);
        if (!list.length) return null;
        return (
          <section key={k}>
            <h2 className="eyebrow-h">{k === 'Episode' ? 'Episodes in year-long programs' : `${k}${k === 'Podcast' || k === 'Audiobook' || k === 'Video' ? 's' : ''}`}</h2>
            <ul className="list">
              {list.map((h) => <li key={h.id}>{h.to ? <Link to={h.to} className="t">{h.title}</Link> : <a href={h.url} target="_blank" rel="noreferrer" className="t">{h.title}</a>}{h.sub && <span className="muted small"> · {h.sub}</span>}</li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
