import { addRecentSearch, clearRecentSearches, useRecentSearches } from '../../lib/recent';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { BOOK_BY_ID } from '../../lib/canon';
import { formatRef, refId, suggestBooks } from '../../lib/refs';
import { readerPath } from '../../lib/nav';
import {
  highlight, interpretReference, parseQuery, searchCommentary, searchEntities, searchEpisodes, searchLibrary, searchNotes, searchScripture, searchTopics,
  type Snip, type VerseHit,
} from '../../search/engine';
import RefLink from '../../components/RefLink';
import { getIndex } from '../../search/useIndex';
import { didYouMean, groupHits, queryTerms, rank, GROUPS, type Hit, type Group } from '../../search/rank';
import { SAMPLE_QUESTIONS } from '../../search/synonyms';
import { askCatechism, type Answer } from '../../study/ask';
import Icon from '../../components/Icon';

type Kind = 'all' | Group;
const KINDS: [Kind, string][] = [['all', 'All'], ...GROUPS.map((g) => [g.id, g.label] as [Kind, string])];

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { editions, get } = useEditions();
  const [settings] = useSettings();
  const qParam = sp.get('q') ?? '';
  const [input, setInput] = useState(qParam);
  const [kind, setKind] = useState<Kind>('all');
  const [allEd, setAllEd] = useState(false);
  const [book, setBook] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState('');
  const [more, setMore] = useState<Record<string, boolean>>({});
  const [res, setRes] = useState<{ verses: VerseHit[]; verseTotal: number; topics: Snip[]; fathers: Snip[]; commentary: Snip[]; episodes: Snip[]; mine: Snip[]; entities: Awaited<ReturnType<typeof searchEntities>>; ccc: Answer | null } | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [mean, setMean] = useState<string | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const saved = useLiveQuery(() => db.savedSearches.toArray(), []) ?? [];
  const recent = useRecentSearches(8);
  const edition = get(settings.defaultEdition) ?? editions[0];
  const numbering: 'vulgate' | 'english' = settings.refNumbering === 'edition' ? (edition.scheme === 'vulgate' ? 'vulgate' : 'english') : settings.refNumbering;

  const ref = useMemo(() => interpretReference(qParam, numbering), [qParam, numbering]);
  /** A question is searched by its content words ("why do Catholics pray to saints" becomes "pray saints"). */
  const cleaned = useMemo(() => {
    const t = queryTerms(qParam);
    return t.isQuestion && t.content.length ? t.content.join(' ') : qParam;
  }, [qParam]);
  const effective = useMemo(() => {
    let s = cleaned;
    if (book) s += ` in:${BOOK_BY_ID[book].aliases[0] ?? book}`;
    if (author) s += ` by:${author}`;
    return s;
  }, [cleaned, book, author]);

  // typing updates the address after a short pause, so the box stays fast
  useEffect(() => {
    if (input.trim() === qParam.trim()) return;
    const t = setTimeout(() => setSp(input.trim() ? { q: input.trim() } : {}, { replace: true }), 350);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    setInput(qParam);
    if (!qParam.trim()) {
      setRes(null);
      setHits(null);
      setMean(null);
      return;
    }
    let live = true;
    const ok = () => live;
    void addRecentSearch(qParam).catch(() => {});
    setMore({});
    // 1. Best answers: small indexes, ready quickly
    (async () => {
      setBusy('Searching the library…');
      const quick = await getIndex('library');
      if (!ok()) return;
      const m = didYouMean(quick, qParam);
      setMean(m);
      const used = m ?? qParam;
      setHits(rank(quick, used));
      // 2. lessons arrive later and are merged in
      setLessonsLoading(true);
      const full = await getIndex('full');
      if (!ok()) return;
      setHits(rank(full, used));
      setLessonsLoading(false);
    })().catch(() => ok() && setLessonsLoading(false));
    // 3. passages, in parallel
    (async () => {
      const q = parseQuery(effective);
      if (book) q.scopeBook = book;
      const eds = allEd ? editions : [edition];
      const [v, topics, fathers, commentary, episodes, mine, entities, ccc] = await Promise.all([
        searchScripture(eds, q, 60, (e, d, t) => ok() && d < t && setBusy(`Indexing ${e} for search (${Math.round((100 * d) / t)}%)…`)),
        searchTopics(q),
        searchLibrary(q),
        searchCommentary(q),
        searchEpisodes(q),
        searchNotes(q),
        searchEntities(q),
        askCatechism(qParam).catch(() => null),
      ]);
      if (ok()) {
        setRes({ verses: v.hits, verseTotal: v.total, topics, fathers, commentary, episodes, mine, entities, ccc });
        setBusy('');
      }
    })().catch((e) => ok() && setBusy(`Search error: ${e.message}`));
    return () => {
      live = false;
    };
  }, [qParam, effective, allEd, edition.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSp({ q: input.trim() });
  };
  const q = useMemo(() => parseQuery(effective), [effective]);
  const show = (k: Group) => kind === 'all' || kind === k;
  const authors = useMemo(() => [...new Set([...(res?.fathers ?? []), ...(res?.commentary ?? [])].map((s) => s.author).filter(Boolean) as string[])], [res]);
  const filterAuthor = (list: Snip[]) => (author ? list.filter((s) => s.author?.toLowerCase().includes(author.toLowerCase())) : list);

  const grouped = useMemo(() => Object.fromEntries(GROUPS.map((g) => [g.id, (hits ?? []).filter((h) => h.doc.group === g.id)])) as Record<Group, Hit[]>, [hits]);
  const hitItem = (h: Hit) => (
    <div key={h.doc.id} className="item">
      <Link className="t" to={h.doc.href}>{h.doc.title}</Link>
      {h.doc.sub && <div className="by">{h.doc.sub}</div>}
      <div className="why">{h.doc.badge}</div>
    </div>
  );
  const snipItems = (items: Snip[]) => items.map((s) => (
    <div key={s.id} className="item">
      {s.href ? <Link className="t" to={s.href}>{s.title}</Link> : <a className="t" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>}
      {s.subtitle && <div className="by">{s.subtitle}</div>}
      {s.snippet && <div className="ex snippet" dangerouslySetInnerHTML={{ __html: highlight(s.snippet, q) }} />}
      {s.badge && <div className="why">{s.badge}</div>}
    </div>
  ));
  const cccItems = (res?.ccc?.paras ?? []).map((p) => (
    <div key={'ccc' + p.n} className="item">
      <Link className="t" to={`/study/catechism/${p.n}`}>Catechism {p.n}</Link>
      <div className="ex snippet">{p.text.length > 260 ? p.text.slice(0, 259) + '…' : p.text}</div>
      <div className="why">Catechism of the Catholic Church</div>
    </div>
  ));
  const verseItems = (res?.verses ?? []).map((h, i) => (
    <div key={i} className="item">
      <div className="row between">
        <Link className="t" to={`/read/${h.edition.id}/${h.book}/${h.c}?v=${h.v}`}>
          {formatRef({ book: h.book, c1: h.c, v1: h.v, c2: h.c, v2: h.v })} <span className="muted">({h.edition.shortName})</span>
        </Link>
        {!h.exact && <span className="chip warn">approximate</span>}
      </div>
      <div className="ex snippet" lang={h.edition.language} dangerouslySetInnerHTML={{ __html: highlight(h.text, q) }} />
    </div>
  ));
  const entityItems = (res?.entities ?? []).map(({ entity, refs }) => (
    <div key={entity.id} className="item">
      <div className="t">{entity.name} <span className="chip">{entity.kind}</span></div>
      <div className="chips" style={{ marginTop: 6 }}>{refs.map((r, i) => <RefLink key={i} refv={r} />)}</div>
      <div className="why">Hand-made index of key passages; not exhaustive.</div>
    </div>
  ));
  const sections: { id: Group; items: React.ReactNode[]; note?: string; loading?: boolean }[] = [
    { id: 'best', items: grouped.best.map(hitItem) },
    { id: 'teaching', items: [...cccItems, ...grouped.teaching.map(hitItem), ...snipItems(res?.topics ?? [])] },
    { id: 'scripture', items: [...entityItems, ...verseItems], note: 'Exact text matches in the translation. “Approximate” results were widened to similar spellings.' },
    { id: 'fathers', items: [...grouped.fathers.map(hitItem), ...snipItems(filterAuthor(res?.fathers ?? [])), ...snipItems(filterAuthor(res?.commentary ?? []))] },
    { id: 'do', items: grouped.do.map(hitItem) },
    { id: 'learn', items: [...grouped.learn.map(hitItem), ...snipItems(res?.episodes ?? [])], loading: lessonsLoading },
    { id: 'mine', items: snipItems(res?.mine ?? []) },
  ];
  const visible = sections.filter((s) => show(s.id) && s.items.length);
  const total = visible.reduce((a, s) => a + s.items.length, 0);
  const waiting = !!busy || hits === null;
  const results = useRef<HTMLDivElement>(null);
  const arrows = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...(results.current?.querySelectorAll<HTMLElement>('a.t, button.search-more') ?? [])];
    if (!links.length) return;
    const i = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowUp' && i <= 0 && document.activeElement !== (e.currentTarget as HTMLElement)) return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(i + 1, links.length - 1)) : i === 0 ? -1 : i - 1;
    if (next < 0) (document.querySelector('.search-box input') as HTMLElement | null)?.focus();
    else links[next].focus();
  };

  return (
    <div className="page" onKeyDown={arrows}>
      <h1>Search</h1>
      <form className="search-box" onSubmit={submit} role="search">
        <input type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question, or type a reference, phrase or topic…" aria-label="Search" autoFocus enterKeyHint="search" />
        <button className="btn primary" type="submit">
          <Icon name="search" size={18} /> Search
        </button>
        {qParam && (
          <button type="button" className="btn" onClick={() => db.savedSearches.add({ query: qParam, createdAt: Date.now() })} title="Save this search">
            Save
          </button>
        )}
      </form>
      <details className="small" style={{ marginBottom: 8 }}>
        <summary>Search tips and filters</summary>
        <p className="muted">
          Ask in plain words (<code>why do Catholics pray to saints</code>), or use <code>"exact phrase"</code>, partial words (<code>righteous</code> finds righteousness), references (<code>Jn 6:51-58</code>, <code>1 cor 13</code>, <code>ps23</code>), <code>in:john</code> or <code>in:NT</code> to limit to a book or testament, and <code>by:augustine</code> for Fathers and saints. Use the arrow keys to move through the results.
        </p>
        <div className="row">
          <select value={book} onChange={(e) => setBook(e.target.value)} aria-label="Limit to book">
            <option value="">Any book</option>
            {Object.values(BOOK_BY_ID).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={allEd} onChange={(e) => setAllEd(e.target.checked)} /> Search every translation (otherwise {edition.shortName})
          </label>
        </div>
      </details>

      {!qParam && (
        <div className="card">
          <strong>Try asking</strong>
          <div className="chips" style={{ margin: '6px 0 10px' }}>
            {SAMPLE_QUESTIONS.map((s) => <Link key={s} className="chip" to={`/study/search?q=${encodeURIComponent(s)}`}>{s}</Link>)}
          </div>
          {saved.length > 0 && (
            <>
              <strong>Saved searches</strong>
              <div className="chips" style={{ margin: '6px 0 10px' }}>
                {saved.map((s) => (
                  <span key={s.id} className="chip">
                    <Link to={`/study/search?q=${encodeURIComponent(s.query)}`}>{s.query}</Link>{' '}
                    <button aria-label={`Delete saved search ${s.query}`} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => db.savedSearches.delete(s.id!)}>×</button>
                  </span>
                ))}
              </div>
            </>
          )}
          {recent.length > 0 && (
            <>
              <strong>Recent</strong>
              <div className="chips" style={{ marginTop: 6 }}>
                {recent.map((s) => <Link key={s.id} className="chip" to={`/study/search?q=${encodeURIComponent(s.query)}`}>{s.query}</Link>)}
                <button className="btn small ghost" onClick={() => clearRecentSearches()}>Clear</button>
              </div>
            </>
          )}
        </div>
      )}

      {qParam && (
        <>
          {ref.ok && (
            <div className="card">
              <strong>Scripture reference</strong>
              {ref.results.map((r, i) => (
                <div key={i} className="row" style={{ margin: '6px 0' }}>
                  <Link className="btn primary" to={readerPath(edition, r.refs[0])}>Read {r.display}</Link>
                  <Link className="btn" to={`/study/passage/${refId(r.refs[0])}`}>Study</Link>
                  {r.note && <span className="muted small">{r.note}</span>}
                </div>
              ))}
              {numbering === 'english' && <p className="muted small">Typed numbers are read as English/Hebrew numbering (change in Settings).</p>}
            </div>
          )}
          {!ref.ok && ref.error && ref.suggestions.length > 0 && /^[a-z0-9 .]+$/i.test(qParam) && (
            <div className="notice info">
              {ref.error} Did you mean{' '}
              {ref.suggestions.map((s, i) => (
                <span key={s}>{i > 0 && ', '}<Link to={`/study/search?q=${encodeURIComponent(BOOK_BY_ID[s].name + ' ' + (qParam.match(/[\d:.\-, ]+$/)?.[0] ?? '1'))}`}>{BOOK_BY_ID[s].name}</Link></span>
              ))}
              ?
            </div>
          )}
          {mean && <div className="notice info">Showing answers for <Link to={`/study/search?q=${encodeURIComponent(mean)}`}>{mean}</Link>, the closest spelling in the library.</div>}

          <div className="row" style={{ margin: '8px 0 14px', gap: 8, flexWrap: 'wrap' }}>
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} aria-label="What to show">
              {KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            {authors.length > 0 && (
              <select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by author">
                <option value="">Any author</option>
                {authors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>
          <div role="status" aria-live="polite" className={busy || lessonsLoading ? 'notice info' : 'sr-only'} style={busy || lessonsLoading ? undefined : { position: 'absolute', left: -9999 }}>
            {busy || (lessonsLoading ? 'Still looking through the lessons…' : waiting ? '' : `${total} results in ${visible.length} groups.`)}
          </div>

          <div ref={results}>
            {visible.map((s) => <ResultGroup key={s.id} id={s.id} items={s.items} note={s.note} open={!!more[s.id]} onMore={() => setMore((m) => ({ ...m, [s.id]: !m[s.id] }))} />)}
            {!waiting && total === 0 && (
              <div className="empty">
                <p>Nothing found for “{qParam}”.{mean && <> Did you mean <Link to={`/study/search?q=${encodeURIComponent(mean)}`}>{mean}</Link>?</>}</p>
                <p className="muted small">Try fewer or simpler words, or ask one of these:</p>
                <div className="chips">
                  {SAMPLE_QUESTIONS.slice(0, 5).map((s) => <Link key={s} className="chip" to={`/study/search?q=${encodeURIComponent(s)}`}>{s}</Link>)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <button style={{ display: 'none' }} onClick={() => nav('/')} />
    </div>
  );
}

function ResultGroup({ id, items, note, open, onMore }: { id: Group; items: React.ReactNode[]; note?: string; open: boolean; onMore: () => void }) {
  const g = GROUPS.find((x) => x.id === id)!;
  const shown = open ? items : items.slice(0, g.first);
  const hid = `sg-${id}`;
  return (
    <section className="sect" aria-labelledby={hid}>
      <h3 id={hid}>{g.label} <span className="muted small">({items.length})</span></h3>
      {(note ?? g.note) && <div className="muted small" style={{ marginBottom: 6 }}>{note ?? g.note}</div>}
      {shown}
      {items.length > g.first && (
        <button type="button" className="btn small search-more" aria-expanded={open} onClick={onMore}>
          {open ? 'Show fewer' : `Show ${items.length - g.first} more in ${g.label}`}
        </button>
      )}
    </section>
  );
}

