import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BOOK_BY_ID } from '../lib/canon';
import { flattenChapter } from '../lib/bibleText';
import { getBookText } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import { BOOK_PRAYERS } from '../data/prayerbook';
import { copyText } from '../lib/clipboard';
import { butlerDay, type ButlerEntry } from '../study/butler';
import { GLOSSARY } from '../data/glossary';
import { FEASTS } from '../data/feasts';

/** The link someone gets: just the verse or the prayer, readable at once, with a way into the app. */
export function ShareVersePage() {
  const [sp] = useSearchParams();
  const { get, editions } = useEditions();
  const ed = get(sp.get('ed') ?? '') ?? editions[0];
  const book = sp.get('b') ?? '';
  const chapter = +(sp.get('c') ?? 0);
  const [a, b] = (sp.get('v') ?? '').split('-').map(Number);
  const [rows, setRows] = useState<{ n: number; text: string }[] | null | undefined>(undefined);
  useEffect(() => {
    if (!ed || !BOOK_BY_ID[book] || !chapter || !a) { setRows(null); return; }
    let live = true;
    getBookText(ed.id, book).then((d) => { const ch = d.chapters.find((c) => c.n === chapter); const vs = flattenChapter(ch).filter((v) => v.n >= a && v.n <= (b || a)); if (live) setRows(vs.length ? vs : null); }).catch(() => live && setRows(null));
    return () => { live = false; };
  }, [ed?.id, book, chapter, a, b]);
  const label = `${BOOK_BY_ID[book]?.name ?? book} ${chapter}:${a}${b && b !== a ? `-${b}` : ''}`;
  const [copied, setCopied] = useState(false);
  if (rows === undefined) return <div className="page"><div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /></div></div>;
  if (!rows || !ed) return <div className="page"><p>That passage could not be found. <Link to="/read">Open the Bible</Link></p></div>;
  return (
    <div className="page share-link">
      <article className="card share-card-page">
        <blockquote>{rows.map((v) => <p key={v.n}><sup>{v.n}</sup> {v.text}</p>)}</blockquote>
        <p className="eyebrow">{label} · {ed.name}</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn primary" to={`/read/${ed.id}/${book}/${chapter}?v=${a}${b && b !== a ? `-${b}` : ''}`}>Read it in context</Link>
          <button className="btn" onClick={async () => { await copyText(`“${rows.map((v) => v.text).join(' ')}” (${label}, ${ed.shortName})`); setCopied(true); }}>{copied ? 'Copied' : 'Copy the text'}</button>
          <Link className="btn ghost" to="/today">Open the app</Link>
        </div>
      </article>
    </div>
  );
}

export function SharePrayerPage() {
  const { id } = useParams();
  const p = BOOK_PRAYERS.find((x) => x.id === id);
  const [copied, setCopied] = useState(false);
  if (!p) return <div className="page"><p>That prayer could not be found. <Link to="/pray/prayers">Open the prayer book</Link></p></div>;
  return (
    <div className="page share-link">
      <article className="card share-card-page">
        <h1>{p.title}</h1>
        <p className="scripture" style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.text}</p>
        {p.note && <p className="muted small">{p.note}</p>}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn primary" to="/pray/prayers">More prayers</Link>
          <button className="btn" onClick={async () => { await copyText(`${p.title}\n\n${p.text}`); setCopied(true); }}>{copied ? 'Copied' : 'Copy the prayer'}</button>
          <Link className="btn ghost" to="/today">Open the app</Link>
        </div>
      </article>
    </div>
  );
}

/** A saint's life from Butler, shared by day and position. */
export function ShareSaintPage() {
  const { md = '' } = useParams();
  const [sp] = useSearchParams();
  const i = +(sp.get('i') ?? 0);
  const [e, setE] = useState<ButlerEntry | null | undefined>(undefined);
  useEffect(() => { let live = true; if (!/^\d{2}-\d{2}$/.test(md)) { setE(null); return; } butlerDay(md).then((l) => live && setE(l[i] ?? null)); return () => { live = false; }; }, [md, i]);
  if (e === undefined) return <div className="page"><div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /></div></div>;
  if (!e) return <div className="page"><p>That saint could not be found. <Link to="/study/saints">Open the saints</Link></p></div>;
  return (
    <div className="page share-link">
      <article className="card share-card-page">
        <h1>{e.name}</h1>
        {e.text.slice(0, 3).map((p, k) => <p key={k}>{p}</p>)}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn primary" to={`/study/saints/${md}?name=${encodeURIComponent(e.name.toLowerCase())}`}>Read the whole life</Link>
          <Link className="btn ghost" to="/today">Open the app</Link>
        </div>
        <p className="muted small">Alban Butler, Lives of the Saints (public domain).</p>
      </article>
    </div>
  );
}

export function ShareTermPage() {
  const { term = '' } = useParams();
  const g = GLOSSARY.find((x) => x.term.toLowerCase() === decodeURIComponent(term).toLowerCase());
  if (!g) return <div className="page"><p>That word could not be found. <Link to="/study/glossary">Open the glossary</Link></p></div>;
  return (
    <div className="page share-link">
      <article className="card share-card-page">
        <h1>{g.term}</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{g.definition}</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn primary" to={`/study/catechism/${g.ccc}`}>Catechism §{g.ccc}</Link>
          <Link className="btn ghost" to="/study/glossary">More words</Link>
        </div>
      </article>
    </div>
  );
}

export function ShareFeastPage() {
  const { id } = useParams();
  const f = FEASTS.find((x) => x.id === id);
  if (!f) return <div className="page"><p>That feast could not be found. <Link to="/pray/year">Open the Church year</Link></p></div>;
  return (
    <div className="page share-link">
      <article className="card share-card-page">
        <h1>{f.name}</h1>
        <p className="muted">{f.when} · {f.rank}{f.obligation ? ' · holy day of obligation' : ''}</p>
        <p>{f.about}</p>
        {f.customs && <p className="small"><strong>Customs.</strong> {f.customs}</p>}
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn primary" to={`/pray/year?feast=${f.id}`}>See it in the Church year</Link>
          <Link className="btn ghost" to="/today">Open the app</Link>
        </div>
      </article>
    </div>
  );
}
