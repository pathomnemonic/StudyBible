import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getAuthors, getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { recordedWorkIds } from '../../data/librivox';
import { useScrollMemory } from '../../lib/scrollMemory';
import { percentSeen, setShelf, STATUS_LABEL, STATUSES, useShelf } from '../../lib/shelf';
import type { ShelfStatus } from '../../db/db';

const SHELVES: { title: string; blurb: string; ids?: string[]; kinds?: string[] }[] = [
  { title: 'Begin here', blurb: 'Short, rewarding reads from different centuries.', ids: ['lawrence-practice', 'athanasius-incarnation', 'aug-confessions', 'teresa-castle', 'kempis-imitation', 'julian-revelations', 'desales-devout-life', 'therese-story-of-a-soul'] },
  { title: 'The saints on Scripture', blurb: 'Homilies and commentaries that go through a Gospel or letter chapter by chapter. Open one beside the Bible.', kinds: ['homilies', 'commentary', 'sermons'] },
  { title: 'Spiritual classics and lives', blurb: 'Prayer, conversion and the interior life, in the saints’ own words.', kinds: ['spiritual', 'autobiography', 'catechesis', 'hymns'] },
  { title: 'Catechisms, councils and documents', blurb: 'What the Church has taught, in full.', kinds: ['catechism', 'council', 'document'] },
  { title: 'Doctrine and history', blurb: 'Treatises, letters, apologetics and Church history from the early Church.', kinds: ['treatise', 'letters', 'apologetics', 'history', 'summa'] },
];
const TEACHING: [string, string, string][] = [
  ['/study/catechism', 'Catechism of the Catholic Church', 'The full text, paragraph by paragraph, with the Scripture it cites.'],
  ['/study/papal', 'Papal writings', 'Encyclicals, exhortations, constitutions and letters from Pius IX to today.'],
  ['/study/church', 'Councils and Church documents', 'Nicaea to Vatican II, read in full where public domain.'],
  ['/study/doctrine', 'Doctrine by topic', 'Eucharist, Trinity, grace, Mary… with Scripture and Catechism links.'],
  ['/study/saints', 'Lives of the Saints', 'A saint for each day of the year.'],
  ['/study/encyclopedia', 'The Catholic Encyclopedia', 'Articles on the Bible, the Church and her teaching.'],
];
const PLACES: [string, string, string][] = [
  ['/study/apologetics', 'Questions about the faith', 'Catholic authors on the common questions.'],
  ['/study/quotations', 'Who quoted this verse?', 'The Fathers and saints, verse by verse.'],
];

/** The reading room: texts and recordings beyond the Bible, each of which can be opened with a Bible chapter beside it. */
export default function RoomHome() {
  const [works, setWorks] = useState<LibraryWorkMeta[]>([]);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(() => { try { return sessionStorage.getItem('sb:room:q') ?? ''; } catch { return ''; } });
  useEffect(() => { try { sessionStorage.setItem('sb:room:q', q); } catch { /* private mode */ } }, [q]);
  const [sp, setSp] = useSearchParams();
  const [authors, setAuthors] = useState<Record<string, { name: string }>>({});
  const authorId = sp.get('author') ?? '';
  const kindF = sp.get('kind') ?? '';
  const periodF = sp.get('period') ?? '';
  const shelfF = sp.get('shelf') ?? '';
  const tab = sp.get('tab') === 'mine' ? 'mine' : 'discover';
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const filtering = !!(q.trim() || authorId || kindF || periodF);
  const shelf = useShelf();
  const [showFilters, setShowFilters] = useState(false);
  useScrollMemory('/room', works.length > 0, '/room?' + sp.toString());
  useEffect(() => { getLibraryIndex().then((l) => setWorks(l?.works ?? [])); recordedWorkIds().then(setHeard); getAuthors().then((a) => setAuthors(a?.authors ?? {})); }, []);
  const byId = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);
  const reading = useMemo(() => [...shelf.values()].filter((p) => byId.has(p.workId) && p.status === 'reading').sort((a, b) => b.updatedAt - a.updatedAt), [shelf, byId]);
  const found = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!filtering) return [];
    return works.filter((w) => (!f || `${w.title} ${w.author}`.toLowerCase().includes(f)) && (!authorId || w.authorId === authorId) && (!kindF || w.kind === kindF) && (!periodF || w.period === periodF)).slice(0, 120);
  }, [works, q, authorId, kindF, periodF, filtering]);
  const card = (w: LibraryWorkMeta, section = 0) => {
    const p = shelf.get(w.id);
    return (
      <Link key={w.id} className="shelf-card" to={`/room/work/${w.id}/${section}`}>
        <span className="t">{w.title}</span>
        <span className="d">{w.author}{heard.has(w.id) ? ' · 🎧 recorded' : ''}</span>
        {p?.status && <span className={`shelf-badge st-${p.status}`}>{STATUS_LABEL[p.status]}{p.rating ? ` · ${'★'.repeat(p.rating)}` : ''}</span>}
      </Link>
    );
  };
  const open = SHELVES.find((x) => x.title === shelfF);
  const listOf = (sh: (typeof SHELVES)[number]) => (sh.ids ? (sh.ids.map((id) => byId.get(id)).filter(Boolean) as LibraryWorkMeta[]) : works.filter((w) => sh.kinds!.includes(w.kind)));
  return (
    <div className="page room">
      <h1>Reading room</h1>
      <p className="lede">The saints, the Fathers and the Church’s own texts, each of which opens beside a Bible chapter.</p>
      <div className="tabbar" role="tablist">
        <button role="tab" aria-selected={tab === 'discover'} onClick={() => setParam('tab', '')}>Discover</button>
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setParam('tab', 'mine')}>My shelves</button>
      </div>
      {tab === 'mine' ? <MyShelves works={works} card={card} /> : (
        <>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a work or an author…" aria-label="Find a work or an author" style={{ flex: 1, minWidth: 200, maxWidth: 420 }} />
            <button className="btn small" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>Filters</button>
            <Link className="btn small" to="/study/search">Search inside texts</Link>
          </div>
          {(showFilters || periodF || kindF) && (
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <select value={periodF} onChange={(e) => setParam('period', e.target.value)} aria-label="Period"><option value="">Any period</option><option value="patristic">Patristic (to c. 750)</option><option value="medieval">Medieval</option><option value="early-modern">Early modern</option></select>
              <select value={kindF} onChange={(e) => setParam('kind', e.target.value)} aria-label="Kind"><option value="">Any kind</option>{[...new Set(works.map((w) => w.kind))].sort().map((k) => <option key={k}>{k}</option>)}</select>
            </div>
          )}
          {authorId && <p className="small">Showing works by {authors[authorId]?.name ?? authorId}. <button className="linklike" onClick={() => setParam('author', '')}>Show everything</button></p>}
          {filtering && <ul className="plain" style={{ listStyle: 'none', padding: 0 }}>{found.map((w) => <li key={w.id} style={{ padding: '4px 0' }}><Link to={`/room/work/${w.id}/0`}>{w.title}</Link> <span className="muted small">{w.author}</span></li>)}{!found.length && <li className="muted">Nothing matches.</li>}</ul>}
          {!filtering && open && (
            <section className="sect">
              <button className="linklike small" onClick={() => setParam('shelf', '')}>← Back</button>
              <h2 className="eyebrow-h">{open.title}</h2>
              <p className="muted small">{open.blurb}</p>
              <div className="shelf">{listOf(open).map((w) => card(w))}</div>
            </section>
          )}
          {!filtering && !open && (
            <>
              {reading.length > 0 && (
                <section className="sect">
                  <h2 className="eyebrow-h">Continue reading</h2>
                  <div className="shelf">
                    {reading.slice(0, 3).map((p) => { const w = byId.get(p.workId)!; return (
                      <Link key={w.id} className="shelf-card" to={`/room/work/${w.id}/${p.section}`}>
                        <span className="t">{w.title}</span>
                        <span className="d">{w.author} · section {Number(p.section) + 1} of {w.sections.length}</span>
                        <span className="bar"><i style={{ width: `${Math.round(((Number(p.section) + 1) / w.sections.length) * 100)}%` }} /></span>
                      </Link>); })}
                  </div>
                  {reading.length > 3 && <Link className="small" to="?tab=mine">All {reading.length} you are reading →</Link>}
                </section>
              )}
              <section className="sect">
                <h2 className="eyebrow-h">{SHELVES[0].title}</h2>
                <p className="muted small" style={{ margin: '0 0 8px' }}>{SHELVES[0].blurb}</p>
                <div className="shelf">{listOf(SHELVES[0]).slice(0, 4).map((w) => card(w))}</div>
              </section>
              <section className="sect">
                <h2 className="eyebrow-h">Browse</h2>
                <div className="shelf">
                  {SHELVES.slice(1).map((sh) => <button key={sh.title} className="shelf-card as-btn" onClick={() => setParam('shelf', sh.title)}><span className="t">{sh.title}</span><span className="d">{sh.blurb}</span><span className="muted small">{listOf(sh).length} works</span></button>)}
                </div>
              </section>
              <section className="sect">
                <h2 className="eyebrow-h">Church teaching and tradition</h2>
                <div className="shelf">{TEACHING.map(([to, t, d]) => <Link key={to} className="shelf-card" to={to}><span className="t">{t}</span><span className="d">{d}</span></Link>)}</div>
              </section>
              <section className="sect">
                <h2 className="eyebrow-h">Listen</h2>
                <div className="shelf">
                  <Link className="shelf-card" to="/listen?tab=audiobooks"><span className="t">Audiobooks</span><span className="d">{heard.size} works read aloud by volunteers</span></Link>
                  <Link className="shelf-card" to="/listen?tab=podcasts"><span className="t">Catholic podcasts</span><span className="d">Dozens of shows, with your place remembered</span></Link>
                  <Link className="shelf-card" to="/study/videos"><span className="t">Catholic video library</span><span className="d">Talks and teaching from Catholic creators</span></Link>
                </div>
              </section>
              <section className="sect">
                <h2 className="eyebrow-h">More</h2>
                <div className="shelf">{PLACES.map(([to, t, d]) => <Link key={to} className="shelf-card" to={to}><span className="t">{t}</span><span className="d">{d}</span></Link>)}</div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** The reader's own shelves, by status, with a count of what they finished this year. */
function MyShelves({ works, card }: { works: LibraryWorkMeta[]; card: (w: LibraryWorkMeta, section?: number) => React.ReactNode }) {
  const shelf = useShelf();
  const [st, setSt] = useState<ShelfStatus | 'all'>('reading');
  const mine = [...shelf.values()].filter((p) => p.status && works.some((w) => w.id === p.workId));
  const count = (s: ShelfStatus) => mine.filter((p) => p.status === s).length;
  const year = new Date().getFullYear();
  const doneThisYear = mine.filter((p) => p.status === 'finished' && p.finishedAt && new Date(p.finishedAt).getFullYear() === year).length;
  const list = mine.filter((p) => st === 'all' || p.status === st).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <section className="sect">
      <p className="muted small">{mine.length ? `${doneThisYear} finished in ${year}. ` : ''}Open any work and use “Your shelf” at the end of a section to put it here, rate it and keep your thoughts.</p>
      <div className="tabbar" role="tablist">
        {STATUSES.map((s) => <button key={s} role="tab" aria-selected={st === s} onClick={() => setSt(s)}>{STATUS_LABEL[s]} ({count(s)})</button>)}
      </div>
      {list.length === 0 && <div className="empty">Nothing on this shelf yet. Find something in Discover, then mark it Want to read.</div>}
      <div className="shelf">
        {list.map((p) => { const w = works.find((x) => x.id === p.workId)!; return (
          <div key={w.id} className="shelf-card">
            <Link to={`/room/work/${w.id}/${p.section}`} className="t">{w.title}</Link>
            <span className="d">{w.author}{p.rating ? ` · ${'★'.repeat(p.rating)}` : ''}</span>
            {st === 'reading' && <span className="bar"><i style={{ width: `${percentSeen(p, w.sections.length) || Math.round(((Number(p.section) + 1) / w.sections.length) * 100)}%` }} /></span>}
            {p.review && <span className="muted small clamp2">{p.review}</span>}
            <select value={p.status} onChange={(e) => setShelf(w.id, e.target.value === 'none' ? { clear: true } : { status: e.target.value as ShelfStatus })} aria-label={`Shelf for ${w.title}`}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              <option value="none">Not started</option>
            </select>
          </div>); })}
      </div>
    </section>
  );
}
