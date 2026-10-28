import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BOOK_BY_ID } from '../lib/canon';
import { flattenChapter } from '../lib/bibleText';
import { getBookText } from '../data/loader';
import { useEditions } from '../data/EditionsContext';
import { BOOK_PRAYERS } from '../data/prayerbook';
import { copyText } from '../lib/clipboard';

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
