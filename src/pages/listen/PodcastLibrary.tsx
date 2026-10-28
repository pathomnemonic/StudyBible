import { useMemo, useState } from 'react';
import { useShows, type Show } from '../../data/podcasts';
import { toggleFollow, useFollows } from '../../lib/follow';
import { fold } from '../../search/engine';
import { useSettings } from '../../lib/store';
import FilterBar from '../../components/FilterBar';
import Fold from '../../components/Fold';
import { addUserShow, exportOpml, parseOpml, removeUserShow, searchPodcasts } from '../../data/feeds';

const ORDER = ['Programs', 'Catholic classics', 'Apologetics', 'Scripture', 'Theology and philosophy', 'Homilies and daily reflections', 'Spiritual life', 'Prayer', 'Saints and history', 'Faith and culture', 'Family and life', 'News'];

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
      <p className="muted small" style={{ marginTop: 0 }}>{shows.length} Catholic podcasts and year-long programs.</p>
      <AddPodcast />
      <FilterBar active={cat ? 1 : 0}
        search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a show or a host…" aria-label="Find a podcast" />}>
        <label>Subject<select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Subject"><option value="">All subjects</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
      </FilterBar>
      {mine.length > 0 && !q && !cat && (
        <section className="sect"><h2 className="eyebrow-h">Following</h2><div className="shelf">{mine.map((s) => <Card key={s.id} s={s} on onOpen={onOpen} mine={false} />)}</div></section>
      )}
      {groups.map(([c, list]) => (
        <section key={c} className="sect">
          <h2 className="eyebrow-h">{c}</h2>
          <div className="shelf">{list.map((s) => <Card key={s.id} s={s} on={follows.has(s.id)} onOpen={onOpen} mine={!!s.tradition && s.tradition === st.tradition} removable={c === 'Yours'} />)}</div>
        </section>
      ))}
      {!groups.length && <div className="empty">No show matches.</div>}
    </div>
  );
}

function Card({ s, on, onOpen, mine, removable }: { s: Show; on: boolean; onOpen: (id: string) => void; mine: boolean; removable?: boolean }) {
  return (
    <div className="shelf-card pod-card">
      <button className="linklike t" onClick={() => onOpen(s.id)} style={{ textAlign: 'left', fontWeight: 600 }}>{s.title}</button>
      <span className="d">{s.host}{mine ? ' · your Church' : ''}</span>
      <span className="muted small clamp2">{s.note}</span>
      <span className="muted small">{s.episodes} episodes · latest {s.latest || 'n/a'}</span>
      <div className="row" style={{ gap: 6 }}><button className="btn small" aria-pressed={on} onClick={() => toggleFollow(s.id, !on)}>{on ? '✓ Following' : '+ Follow'}</button>{removable && <button className="btn small ghost" onClick={() => confirm(`Remove ${s.title}?`) && removeUserShow(s.id)}>Remove</button>}</div>
    </div>
  );
}

/** Add any podcast: search the public directory, paste a feed link, or bring a list from another podcast app. */
function AddPodcast() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ title: string; host: string; feed: string; image: string; count: number }[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<void>) => { setBusy(true); setMsg(''); try { await f(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  const isLink = /^(https?|feed):\/\//i.test(q.trim());
  return (
    <Fold rare id="pod:add" title="Add a podcast of your own" hint="Search for any show, paste its feed link, or import a list from another app.">
      <form className="row" style={{ gap: 8, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); void run(async () => { if (isLink) { const sh = await addUserShow(q); setMsg(`Added ${sh.title}.`); setQ(''); } else setRes(await searchPodcasts(q)); }); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="A show’s name, or a feed link (https://…)" aria-label="Search for a podcast or paste a feed link" style={{ flex: 1, minWidth: 220 }} />
        <button className="btn primary" disabled={busy || !q.trim()}>{isLink ? 'Add this feed' : 'Search'}</button>
      </form>
      {res && <ul className="list">{res.map((r) => <li key={r.feed} className="row between"><span style={{ minWidth: 0 }}><strong>{r.title}</strong><span className="muted small"> · {r.host}{r.count ? ` · ${r.count} episodes` : ''}</span></span><button className="btn small" disabled={busy} onClick={() => run(async () => { const sh = await addUserShow(r.feed, r); setMsg(`Added ${sh.title}.`); })}>+ Add</button></li>)}{!res.length && <li className="muted">Nothing found.</li>}</ul>}
      <div className="row" style={{ gap: 8, margin: '8px 0', flexWrap: 'wrap' }}>
        <label className="btn small">Import from another app (OPML)<input type="file" accept=".opml,.xml,text/xml" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(async () => { const list = parseOpml(await f.text()); let n = 0; for (const x of list.slice(0, 60)) { try { await addUserShow(x.feed, { title: x.title }); n++; } catch { /* skip an unreadable feed */ } } setMsg(`Added ${n} of ${list.length} shows.`); }); }} /></label>
        <button className="btn small" onClick={async () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await exportOpml()], { type: 'text/x-opml' })); a.download = 'studybible-podcasts.opml'; a.click(); }}>Export my list (OPML)</button>
      </div>
      <p className="muted small" role="status">{busy ? 'Working…' : msg}</p>
    </Fold>
  );
}
