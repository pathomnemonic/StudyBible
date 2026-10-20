import { useEffect, useMemo, useState } from 'react';
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
import Icon from '../../components/Icon';

type Kind = 'all' | 'scripture' | 'teaching' | 'fathers' | 'commentary' | 'episodes' | 'mine';
const KINDS: [Kind, string][] = [['all', 'All'], ['scripture', 'Scripture'], ['teaching', 'Teaching & topics'], ['fathers', 'Fathers & saints'], ['commentary', 'Commentary'], ['episodes', 'Episodes'], ['mine', 'My notes']];

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
  const [res, setRes] = useState<{ verses: VerseHit[]; verseTotal: number; topics: Snip[]; fathers: Snip[]; commentary: Snip[]; episodes: Snip[]; mine: Snip[]; entities: Awaited<ReturnType<typeof searchEntities>> } | null>(null);
  const saved = useLiveQuery(() => db.savedSearches.toArray(), []) ?? [];
  const recent = useLiveQuery(() => db.recentSearches.orderBy('ts').reverse().limit(8).toArray(), []) ?? [];
  const edition = get(settings.defaultEdition) ?? editions[0];
  const numbering: 'vulgate' | 'english' = settings.refNumbering === 'edition' ? (edition.scheme === 'vulgate' ? 'vulgate' : 'english') : settings.refNumbering;

  const ref = useMemo(() => interpretReference(qParam, numbering), [qParam, numbering]);
  const effective = useMemo(() => {
    let s = qParam;
    if (book) s += ` in:${BOOK_BY_ID[book].aliases[0] ?? book}`;
    if (author) s += ` by:${author}`;
    return s;
  }, [qParam, book, author]);

  useEffect(() => {
    setInput(qParam);
    if (!qParam.trim()) {
      setRes(null);
      return;
    }
    let live = true;
    (async () => {
      const q = parseQuery(effective);
      if (book) q.scopeBook = book;
      db.recentSearches.where('query').equals(qParam).delete().catch(() => {});
      db.recentSearches.add({ query: qParam, ts: Date.now() });
      setBusy('Searching…');
      const eds = allEd ? editions : [edition];
      const [v, topics, fathers, commentary, episodes, mine, entities] = await Promise.all([
        searchScripture(eds, q, 60, (e, d, t) => live && d < t && setBusy(`Indexing ${e} for search (${Math.round((100 * d) / t)}%)…`)),
        searchTopics(q),
        searchLibrary(q),
        searchCommentary(q),
        searchEpisodes(q),
        searchNotes(q),
        searchEntities(q),
      ]);
      if (live) {
        setRes({ verses: v.hits, verseTotal: v.total, topics, fathers, commentary, episodes, mine, entities });
        setBusy('');
      }
    })().catch((e) => live && setBusy(`Search error: ${e.message}`));
    return () => {
      live = false;
    };
  }, [qParam, effective, allEd, edition.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSp({ q: input.trim() });
  };
  const q = useMemo(() => parseQuery(effective), [effective]);
  const show = (k: Kind) => kind === 'all' || kind === k;
  const authors = useMemo(() => [...new Set([...(res?.fathers ?? []), ...(res?.commentary ?? [])].map((s) => s.author).filter(Boolean) as string[])], [res]);
  const filterAuthor = (list: Snip[]) => (author ? list.filter((s) => s.author?.toLowerCase().includes(author.toLowerCase())) : list);

  return (
    <div className="page">
      <h1>Search</h1>
      <form className="search-box" onSubmit={submit} role="search">
        <input type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Reference, phrase, word, person, topic…" aria-label="Search" autoFocus />
        <button className="btn primary" type="submit">
          <Icon name="search" size={18} /> Search
        </button>
        {qParam && (
          <button
            type="button"
            className="btn"
            onClick={() => db.savedSearches.add({ query: qParam, createdAt: Date.now() })}
            title="Save this search"
          >
            Save
          </button>
        )}
      </form>
      <details className="small" style={{ marginBottom: 8 }}>
        <summary>Search tips and filters</summary>
        <p className="muted">
          Use <code>"exact phrase"</code>, partial words (<code>righteous</code> finds righteousness), references (<code>Jn 6:51-58</code>, <code>1 cor 13</code>, <code>ps23</code>), <code>in:john</code> or <code>in:NT</code> to limit to a book or testament, and <code>by:augustine</code> for Fathers and saints. Misspelt words are matched approximately and marked.
        </p>
        <div className="row">
          <select value={book} onChange={(e) => setBook(e.target.value)} aria-label="Limit to book">
            <option value="">Any book</option>
            {Object.values(BOOK_BY_ID).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <label>
            <input type="checkbox" checked={allEd} onChange={(e) => setAllEd(e.target.checked)} /> Search every translation (otherwise {edition.shortName})
          </label>
        </div>
      </details>

      {(recent.length > 0 || saved.length > 0) && !qParam && (
        <div className="card">
          {saved.length > 0 && (
            <>
              <strong>Saved searches</strong>
              <div className="chips" style={{ margin: '6px 0 10px' }}>
                {saved.map((s) => (
                  <span key={s.id} className="chip">
                    <Link to={`/study/search?q=${encodeURIComponent(s.query)}`}>{s.query}</Link>{' '}
                    <button aria-label="Delete saved search" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => db.savedSearches.delete(s.id!)}>×</button>
                  </span>
                ))}
              </div>
            </>
          )}
          {recent.length > 0 && (
            <>
              <strong>Recent</strong>
              <div className="chips" style={{ marginTop: 6 }}>
                {recent.map((s) => (
                  <Link key={s.id} className="chip" to={`/study/search?q=${encodeURIComponent(s.query)}`}>{s.query}</Link>
                ))}
                <button className="btn small ghost" onClick={() => db.recentSearches.clear()}>Clear</button>
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
                <span key={s}>
                  {i > 0 && ', '}
                  <Link to={`/study/search?q=${encodeURIComponent(BOOK_BY_ID[s].name + ' ' + (qParam.match(/[\d:.\-, ]+$/)?.[0] ?? '1'))}`}>{BOOK_BY_ID[s].name}</Link>
                </span>
              ))}
              ?
            </div>
          )}
          {!ref.ok && !ref.error && suggestBooks(qParam.split(/\s+/)[0]).length > 0 && /^[a-z]{4,}$/i.test(qParam.trim()) && suggestBooks(qParam).length > 0 && !res?.verses.length && (
            <div className="notice info">Did you mean a book: {suggestBooks(qParam).map((s) => BOOK_BY_ID[s].name).join(', ')}?</div>
          )}

          <div className="chips" style={{ margin: '8px 0 14px' }}>
            {KINDS.map(([k, label]) => (
              <button key={k} className={`chip${kind === k ? ' sel' : ''}`} onClick={() => setKind(k)}>
                {label}
              </button>
            ))}
            {authors.length > 0 && (
              <select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by author">
                <option value="">Any author</option>
                {authors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
          </div>
          {busy && <div className="notice info">{busy}</div>}

          {res && (
            <>
              {res.entities.length > 0 && show('teaching') && (
                <Group title="People & places">
                  {res.entities.map(({ entity, refs }) => (
                    <div key={entity.id} className="item">
                      <div className="t">{entity.name} <span className="chip">{entity.kind}</span></div>
                      <div className="chips" style={{ marginTop: 6 }}>
                        {refs.map((r, i) => (
                          <RefLink key={i} refv={r} />
                        ))}
                      </div>
                      <div className="why">Hand-made index of key passages; not exhaustive. Use Scripture results below for every occurrence.</div>
                    </div>
                  ))}
                </Group>
              )}
              {show('scripture') && (
                <Group title={`Scripture (${res.verseTotal}${res.verses.length < res.verseTotal ? ', showing top ' + res.verses.length : ''})`} note="Exact text matches in the translation text itself. Results marked “approximate” were widened to similar spellings.">
                  {res.verses.length === 0 && <div className="empty">No verse matches. Try fewer words, or turn on “every translation” in the filters.</div>}
                  {res.verses.map((h, i) => (
                    <div key={i} className="item">
                      <div className="row between">
                        <Link className="t" to={`/read/${h.edition.id}/${h.book}/${h.c}?v=${h.v}`}>
                          {formatRef({ book: h.book, c1: h.c, v1: h.v, c2: h.c, v2: h.v })} <span className="muted">({h.edition.shortName})</span>
                        </Link>
                        {!h.exact && <span className="chip warn">approximate</span>}
                      </div>
                      <div className="ex snippet" lang={h.edition.language} dangerouslySetInnerHTML={{ __html: highlight(h.text, q) }} />
                    </div>
                  ))}
                </Group>
              )}
              {show('teaching') && res.topics.length > 0 && (
                <Group title="Doctrine topics & official documents" note="Topic pages are editorial; documents link to the Vatican. The Catechism text itself is not stored (rights), so use the paragraph links on topic pages.">
                  <SnipList items={res.topics} q={q} />
                </Group>
              )}
              {show('fathers') && (
                <Group title="Fathers & saints (full text)" note="Section-level full-text index of the bundled public-domain works.">
                  <SnipList items={filterAuthor(res.fathers)} q={q} empty="No section of the bundled works contains these words." />
                </Group>
              )}
              {show('commentary') && (
                <Group title="Commentary (Catena Aurea)">
                  <SnipList items={filterAuthor(res.commentary)} q={q} empty="No commentary text matches." />
                </Group>
              )}
              {show('episodes') && (
                <Group title="Bible in a Year episodes" note="Searches episode titles, descriptions and the passages each episode covers. Transcripts are not published in the official feed.">
                  <SnipList items={res.episodes} q={q} empty="No episode matches." />
                </Group>
              )}
              {show('mine') && (
                <Group title="My notes, highlights & journal">
                  <SnipList items={res.mine} q={q} empty="Nothing in your notes matches." />
                </Group>
              )}
            </>
          )}
        </>
      )}
      <button style={{ display: 'none' }} onClick={() => nav('/')} />
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="sect">
      <h3>{title}</h3>
      {note && <div className="muted small" style={{ marginBottom: 6 }}>{note}</div>}
      {children}
    </section>
  );
}

function SnipList({ items, q, empty }: { items: Snip[]; q: ReturnType<typeof parseQuery>; empty?: string }) {
  if (!items.length) return <div className="empty">{empty ?? 'Nothing found. Check the spelling, try fewer words, or search a book and chapter such as “John 3”.'}</div>;
  return (
    <>
      {items.map((s) => (
        <div key={s.id} className="item">
          {s.href ? (
            <Link className="t" to={s.href}>{s.title}</Link>
          ) : (
            <a className="t" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>
          )}
          {s.subtitle && <div className="by">{s.subtitle}</div>}
          {s.snippet && <div className="ex snippet" dangerouslySetInnerHTML={{ __html: highlight(s.snippet, q) }} />}
          {s.badge && <div className="why">{s.badge}</div>}
        </div>
      ))}
    </>
  );
}
