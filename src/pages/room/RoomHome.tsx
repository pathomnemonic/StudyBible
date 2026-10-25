import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getAuthors, getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { recordedWorkIds } from '../../data/librivox';

const SHELVES: { title: string; blurb: string; ids?: string[]; kinds?: string[] }[] = [
  { title: 'Begin here', blurb: 'Short, rewarding reads from different centuries.', ids: ['lawrence-practice', 'athanasius-incarnation', 'aug-confessions', 'teresa-castle', 'kempis-imitation', 'julian-revelations', 'desales-devout-life', 'therese-story-of-a-soul'] },
  { title: 'The saints on Scripture', blurb: 'Homilies and commentaries that go through a Gospel or letter chapter by chapter. Open one beside the Bible.', kinds: ['homilies', 'commentary', 'sermons'] },
  { title: 'Spiritual classics and lives', blurb: 'Prayer, conversion and the interior life, in the saints’ own words.', kinds: ['spiritual', 'autobiography', 'catechesis', 'hymns'] },
  { title: 'Catechisms, councils and documents', blurb: 'What the Church has taught, in full.', kinds: ['catechism', 'council', 'document'] },
  { title: 'Doctrine and history', blurb: 'Treatises, letters, apologetics and Church history from the early Church.', kinds: ['treatise', 'letters', 'apologetics', 'history', 'summa'] },
];
const PLACES: [string, string, string][] = [
  ['/study/catechism', 'Catechism of the Catholic Church', 'Read it paragraph by paragraph.'],
  ['/study/church', 'Councils and Church documents', 'Councils, encyclicals and Vatican II.'],
  ['/study/saints', 'Lives of the Saints', 'A saint for each day of the year.'],
  ['/study/encyclopedia', 'The Catholic Encyclopedia', 'Articles on the Bible, the Church and her teaching.'],
  ['/study/apologetics', 'Questions about the faith', 'Catholic authors on the common questions.'],
  ['/study/quotations', 'Who quoted this verse?', 'The Fathers and saints, verse by verse.'],
];

/** The reading room: texts and recordings beyond the Bible, each of which can be opened with a Bible chapter beside it. */
export default function RoomHome() {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [sp, setSp] = useSearchParams();
  const [authors, setAuthors] = useState<Record<string, { name: string }>>({});
  const authorId = sp.get('author') ?? '';
  const kindF = sp.get('kind') ?? '';
  const periodF = sp.get('period') ?? '';
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const filtering = !!(q.trim() || authorId || kindF || periodF);
  const progress = useLiveQuery(() => db.libraryProgress.toArray(), []) ?? [];
  useEffect(() => { getLibraryIndex().then((l) => setWorks(l?.works ?? [])); recordedWorkIds().then(setHeard); getAuthors().then((a) => setAuthors(a?.authors ?? {})); }, []);
  const recent = useMemo(() => [...progress].filter((p) => works.some((w) => w.id === p.workId)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [progress, works]);
  const found = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!filtering) return [];
    return works.filter((w) => (!f || `${w.title} ${w.author}`.toLowerCase().includes(f)) && (!authorId || w.authorId === authorId) && (!kindF || w.kind === kindF) && (!periodF || w.period === periodF)).slice(0, 120);
  }, [works, q, authorId, kindF, periodF, filtering]);
  const card = (w: LibraryWorkMeta, section = 0) => (
    <Link key={w.id} className="shelf-card" to={`/room/work/${w.id}/${section}`}>
      <span className="t">{w.title}</span>
      <span className="d">{w.author}{heard.has(w.id) ? ' · 🎧 recorded' : ''}</span>
    </Link>
  );
  return (
    <div className="page room">
      <h1>Reading room</h1>
      <p className="lede">Read and listen to the saints, the Fathers and the Church’s own texts. Every work opens with a Bible chapter beside it, so you can read the Scripture and what the saints made of it at the same time.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a work or an author…" aria-label="Find a work or an author" style={{ flex: 1, minWidth: 220, maxWidth: 420 }} />
        <select value={periodF} onChange={(e) => setParam('period', e.target.value)} aria-label="Period"><option value="">Any period</option><option value="patristic">Patristic (to c. 750)</option><option value="medieval">Medieval</option><option value="early-modern">Early modern</option></select>
        <select value={kindF} onChange={(e) => setParam('kind', e.target.value)} aria-label="Kind"><option value="">Any kind</option>{[...new Set(works.map((w) => w.kind))].sort().map((k) => <option key={k}>{k}</option>)}</select>
        <Link className="btn" to="/study/search">Search inside all texts</Link>
      </div>
      {authorId && <p className="small">Showing works by {authors[authorId]?.name ?? authorId}. <button className="linklike" onClick={() => setParam('author', '')}>Show everything</button></p>}
      {filtering && <ul className="plain" style={{ listStyle: 'none', padding: 0 }}>{found.map((w) => <li key={w.id} style={{ padding: '4px 0' }}><Link to={`/room/work/${w.id}/0`}>{w.title}</Link> <span className="muted small">{w.author}</span></li>)}{!found.length && <li className="muted">Nothing matches.</li>}</ul>}
      {!filtering && recent.length > 0 && (
        <section className="sect">
          <h2 className="eyebrow-h">Continue</h2>
          <div className="shelf">
            {recent.map((p) => { const w = works.find((x) => x.id === p.workId)!; return (
              <Link key={w.id} className="shelf-card" to={`/room/work/${w.id}/${p.section}`}>
                <span className="t">{w.title}</span>
                <span className="d">{w.author} · section {Number(p.section) + 1} of {w.sections.length}</span>
                <span className="bar"><i style={{ width: `${Math.round(((Number(p.section) + 1) / w.sections.length) * 100)}%` }} /></span>
              </Link>); })}
          </div>
        </section>
      )}
      {!filtering && SHELVES.map((sh) => {
        const list = sh.ids ? (sh.ids.map((id) => works.find((w) => w.id === id)).filter(Boolean) as LibraryWorkMeta[]) : works.filter((w) => sh.kinds!.includes(w.kind));
        if (!list.length) return null;
        return (
          <section key={sh.title} className="sect">
            <h2 className="eyebrow-h">{sh.title}</h2>
            <p className="muted small" style={{ margin: '0 0 8px' }}>{sh.blurb}</p>
            <div className="shelf">{(sh.ids ? list : list.slice(0, 12)).map((w) => card(w))}</div>
            {!sh.ids && list.length > 12 && <button className="linklike small" onClick={() => { setParam("kind", sh.kinds![0]); }}>All {list.length} in this group, with filters →</button>}
          </section>
        );
      })}
      {!filtering && (
        <section className="sect">
          <h2 className="eyebrow-h">Listen</h2>
          <div className="shelf">
            <Link className="shelf-card" to="/listen"><span className="t">The Bible in a Year</span><span className="d">Fr. Mike Schmitz, daily</span></Link>
            <Link className="shelf-card" to="/listen#recorded"><span className="t">Recorded books</span><span className="d">{heard.size} works read aloud by volunteers</span></Link>
            <Link className="shelf-card" to="/study/videos"><span className="t">Catholic video library</span><span className="d">Talks and teaching from Catholic creators</span></Link>
          </div>
        </section>
      )}
      {!filtering && (
        <section className="sect">
          <h2 className="eyebrow-h">More to read</h2>
          <div className="shelf">{PLACES.map(([to, t, d]) => <Link key={to} className="shelf-card" to={to}><span className="t">{t}</span><span className="d">{d}</span></Link>)}</div>
        </section>
      )}
    </div>
  );
}
