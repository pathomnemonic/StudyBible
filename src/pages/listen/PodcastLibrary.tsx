import { useMemo, useState } from 'react';
import { useShows, type Show } from '../../data/podcasts';
import { toggleFollow, useFollows } from '../../lib/follow';
import { fold } from '../../search/engine';
import { useSettings } from '../../lib/store';

const ORDER = ['Programs', 'Apologetics', 'Scripture', 'Theology and philosophy', 'Homilies and daily reflections', 'Spiritual life', 'Prayer', 'Saints and history', 'Faith and culture', 'Family and life', 'News'];

/** Every show in the library, by subject, with a search and a Follow button on each. */
export default function PodcastLibrary({ onOpen }: { onOpen: (id: string) => void }) {
  const shows = useShows();
  const follows = useFollows();
  const [st] = useSettings();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const groups = useMemo(() => {
    const f = fold(q.trim());
    const list = (shows ?? []).filter((s) => (!cat || (s.category ?? 'Faith and culture') === cat) && (!f || fold(`${s.title} ${s.host} ${s.publisher} ${s.note}`).includes(f)));
    const m = new Map<string, Show[]>();
    for (const s of list) { const c = s.category ?? 'Faith and culture'; m.set(c, [...(m.get(c) ?? []), s]); }
    return [...m.entries()].sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
  }, [shows, q, cat]);
  if (!shows) return <div className="center-note">Loading…</div>;
  const cats = [...new Set(shows.map((s) => s.category ?? 'Faith and culture'))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const mine = shows.filter((s) => follows.has(s.id));
  return (
    <div>
      <p className="muted small" style={{ marginTop: 0 }}>{shows.length} Catholic podcasts and year-long programs. Episode lists come from each publisher’s own public feed and the audio plays from them. Open a show to listen; follow it to see new episodes under Listen now.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a show or a host…" aria-label="Find a podcast" style={{ flex: 1, minWidth: 200, maxWidth: 380 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Subject"><option value="">All subjects</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {mine.length > 0 && !q && !cat && (
        <section className="sect"><h2 className="eyebrow-h">Following</h2><div className="shelf">{mine.map((s) => <Card key={s.id} s={s} on onOpen={onOpen} mine={false} />)}</div></section>
      )}
      {groups.map(([c, list]) => (
        <section key={c} className="sect">
          <h2 className="eyebrow-h">{c}</h2>
          <div className="shelf">{list.map((s) => <Card key={s.id} s={s} on={follows.has(s.id)} onOpen={onOpen} mine={!!s.tradition && s.tradition === st.tradition} />)}</div>
        </section>
      ))}
      {!groups.length && <div className="empty">No show matches.</div>}
    </div>
  );
}

function Card({ s, on, onOpen, mine }: { s: Show; on: boolean; onOpen: (id: string) => void; mine: boolean }) {
  return (
    <div className="shelf-card pod-card">
      <button className="linklike t" onClick={() => onOpen(s.id)} style={{ textAlign: 'left', fontWeight: 600 }}>{s.title}</button>
      <span className="d">{s.host}{mine ? ' · your Church' : ''}</span>
      <span className="muted small clamp2">{s.note}</span>
      <span className="muted small">{s.episodes} episodes · latest {s.latest || 'n/a'}</span>
      <button className="btn small" aria-pressed={on} onClick={() => toggleFollow(s.id, !on)}>{on ? '✓ Following' : '+ Follow'}</button>
    </div>
  );
}
