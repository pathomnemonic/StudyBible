import FilterBar from '../../components/FilterBar';
import { Group, HubHeader, Tiles } from '../../components/Hub';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getAuthors, getLibraryIndex, type LibraryWorkMeta } from '../../data/content';
import { recordedWorkIds } from '../../data/librivox';
import Fold from '../../components/Fold';
import { getGoal, setGoal, useReadingStats } from '../../lib/readingTime';
import { addBookFile, bookMeta, useUserBooks } from '../../data/userBooks';
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
/** The reading room: texts and recordings beyond the Bible. */
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
  useScrollMemory('/room', works.length > 0, '/room?' + sp.toString());
  useEffect(() => { getLibraryIndex().then((l) => setWorks(l?.works ?? [])); recordedWorkIds().then(setHeard); getAuthors().then((a) => setAuthors(a?.authors ?? {})); }, []);
  const mine = useUserBooks();
  const all = useMemo(() => [...works, ...mine.map(bookMeta)], [works, mine]);
  const byId = useMemo(() => new Map(all.map((w) => [w.id, w])), [all]);
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
      <HubHeader title="Read" sub="The saints, the Fathers and the Church’s own texts, with every Bible reference a tap away." />
      <div className="tabbar" role="tablist">
        <button role="tab" aria-selected={tab === 'discover'} onClick={() => setParam('tab', '')}>Discover</button>
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setParam('tab', 'mine')}>My shelves</button>
      </div>
      {tab === 'mine' ? <MyShelves works={all} card={card} /> : (
        <>
          <FilterBar active={(periodF ? 1 : 0) + (kindF ? 1 : 0)}
            search={<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a work or an author…" aria-label="Find a work or an author" />}
            extra={<Link className="btn small" to="/study/search">Search inside texts</Link>}>
        <select value={periodF} onChange={(e) => setParam('period', e.target.value)} aria-label="Period"><option value="">Any period</option><option value="patristic">Patristic (to c. 750)</option><option value="medieval">Medieval</option><option value="early-modern">Early modern</option></select>
        <select value={kindF} onChange={(e) => setParam('kind', e.target.value)} aria-label="Kind"><option value="">Any kind</option>{[...new Set(works.map((w) => w.kind))].sort().map((k) => <option key={k}>{k}</option>)}</select>
          </FilterBar>
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
              <section className="sect">
                <h2 className="eyebrow-h">{SHELVES[0].title}</h2>
                <p className="muted small" style={{ margin: '0 0 8px' }}>{SHELVES[0].blurb}</p>
                <div className="shelf">{listOf(SHELVES[0]).slice(0, 4).map((w) => card(w))}</div>
              </section>
              <section className="sect">
                <h2 className="eyebrow-h">Browse</h2>
                <div className="hub-tiles">
                  {SHELVES.slice(1).map((sh, i) => <button key={sh.title} className="hub-tile as-btn" onClick={() => setParam('shelf', sh.title)}><span className="hub-ico" aria-hidden="true">{['📖', '🕯️', '📜', '🏛️'][i] ?? '📚'}</span><span className="hub-tile-t">{sh.title}</span><span className="hub-tile-d">{sh.blurb} {listOf(sh).length} works.</span></button>)}
                </div>
              </section>
              <Group title="More to read" hint="Beyond the Fathers"><Tiles ids={['read.saints', 'read.encyclopedia', 'read.papal', 'read.church', 'read.gallery']} /></Group>
              <Fold id="room:books" title={`Your own books (${mine.length})`} hint="Add an EPUB, text or HTML file and read it here, with highlights, notes and your place remembered." open={mine.length > 0}>
                <AddBooks />
                <div className="shelf">{mine.map((b) => <div key={b.id} className="shelf-card"><Link to={`/room/work/${b.id}/${shelf.get(b.id)?.section ?? 0}`} className="t">{b.title}</Link><span className="d">{b.author || 'Your book'} · {b.sections.length} sections · {Math.round(b.words / 250)} min</span><button className="linklike small" onClick={() => confirm(`Remove “${b.title}” from this device? Your notes on it stay.`) && db.userBooks.delete(b.id)}>Remove</button></div>)}</div>
              </Fold>
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
  const stats = useReadingStats();
  const [goal, setG] = useState(getGoal());
  const [tag, setTag] = useState('');
  const year = new Date().getFullYear();
  const doneThisYear = mine.filter((p) => p.status === 'finished' && p.finishedAt && new Date(p.finishedAt).getFullYear() === year).length;
  const tags = [...new Set(mine.flatMap((p) => p.tags ?? []))].sort();
  const list = mine.filter((p) => (st === 'all' || p.status === st) && (!tag || (p.tags ?? []).includes(tag))).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <section className="sect">
      <div className="read-stats" aria-label="Your reading">
        <div><strong>{stats.today}</strong><span>min today of {goal}</span><i className="bar"><b style={{ width: `${Math.min(100, (stats.today / goal) * 100)}%` }} /></i></div>
        <div><strong>{stats.streak}</strong><span>day streak 🔥</span></div>
        <div><strong>{doneThisYear}</strong><span>finished in {year}</span></div>
        <label className="small">Daily goal <select value={goal} onChange={(e) => { setGoal(+e.target.value); setG(+e.target.value); }}>{[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
        <div className="spark" aria-hidden="true">{stats.week.map((d) => <i key={d.day} title={`${d.day}: ${d.min} min`} style={{ height: `${Math.max(6, Math.min(100, (d.min / Math.max(goal, 1)) * 100))}%` }} className={d.min >= goal ? 'ok' : ''} />)}</div>
      </div>
      {tags.length > 0 && <div className="chips" style={{ margin: '6px 0' }}><span className="muted small">Collections:</span>{tags.map((t) => <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>{t}</button>)}</div>}
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

/** Add a book from a file on this device. */
function AddBooks() {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setMsg('');
    const done: string[] = [];
    for (const f of [...files]) { try { done.push((await addBookFile(f)).title); } catch (e) { setMsg(`${f.name}: ${(e as Error).message}`); } }
    setBusy(false);
    if (done.length) setMsg(`Added ${done.join(', ')}.`);
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <label className="btn primary">{busy ? 'Reading the file…' : 'Add a book'}<input type="file" multiple accept=".epub,.txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html,application/epub+zip" hidden onChange={(e) => { void add(e.target.files); e.target.value = ''; }} /></label>
      <span className="muted small" role="status" style={{ marginLeft: 10 }}>{msg || 'EPUB, text, Markdown or HTML. Kept on this device.'}</span>
    </div>
  );
}
