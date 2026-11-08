import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBookText } from '../../data/loader';
import { getGlossa, getGlossaEn } from '../../data/content';
import { flattenChapter } from '../../lib/bibleText';
import { BOOKS, BOOK_BY_ID } from '../../lib/canon';
import { convertRef } from '../../lib/versification';
import ShareLinkButton from '../../components/ShareLinkButton';

interface Gloss { en: string; la?: string }
const strip = (t: string) => t.replace(/^\d+\.\d+\s*/, '');

/** A chapter laid out like a medieval glossed Bible: the sacred text at the centre, the Glossa Ordinaria in the margins, notes alternating left and right. */
export default function GlossedPage() {
  const { book = 'JHN', chapter = '1' } = useParams();
  const nav = useNavigate();
  const c = Math.max(1, +chapter || 1);
  const info = BOOK_BY_ID[book];
  const [verses, setVerses] = useState<{ n: number; text: string }[] | null>(null);
  const [notes, setNotes] = useState<Record<number, Gloss[]> | null>(null);
  const [latin, setLatin] = useState(false);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let live = true; setVerses(null); setNotes(null);
    getBookText('webc', book).then((d) => { const ch = d.chapters.find((x) => x.n === c); if (live) setVerses(flattenChapter(ch).filter((v) => v.n > 0)); }).catch(() => live && setVerses([]));
    Promise.all([getGlossaEn(book).catch(() => null), getGlossa(book).catch(() => null)]).then(([en, la]) => {
      if (!live) return;
      const out: Record<number, Gloss[]> = {};
      for (const [key, text] of Object.entries(en ?? {})) {
        const [kc, kv] = key.split('.').map(Number); if (!kc || !kv) continue;
        // the Glossa follows the Latin numbering; bring each note to the verse it belongs to in the modern text
        const m = convertRef('vulgate', 'kjv', { book, c1: kc, v1: kv, c2: kc, v2: kv }).ref;
        if (m.c1 !== c) continue;
        (out[m.v1 ?? kv] ??= []).push({ en: strip(text), la: la?.[key]?.map((x) => strip(x[1])).join(' ') });
      }
      setNotes(out);
    });
    return () => { live = false; };
  }, [book, c]);

  const total = useMemo(() => Object.values(notes ?? {}).reduce((n, l) => n + l.length, 0), [notes]);
  const books = BOOKS.filter((b) => true);
  if (!info) return <div className="page"><p>That book could not be found. <Link to="/study/glossed/JHN/1">Open John 1</Link></p></div>;
  return (
    <div className="page glossed">
      <p className="small no-print"><Link to="/read">← Reading</Link></p>
      <h1>The glossed page</h1>
      <p className="lede">The text of {info.name} {c} with the <em>Glossa Ordinaria</em>, the standard medieval commentary, set in the margins as it was in the great manuscripts.</p>
      <div className="gl-controls no-print">
        <label>Book <select value={book} onChange={(e) => nav(`/study/glossed/${e.target.value}/1`)}>{books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label>Chapter <select value={c} onChange={(e) => nav(`/study/glossed/${book}/${e.target.value}`)}>{Array.from({ length: info.chapters }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="tv-check"><input type="checkbox" checked={latin} onChange={(e) => setLatin(e.target.checked)} /> Show the Latin</label>
        <ShareLinkButton path={`/study/glossed/${book}/${c}`} title={`${info.name} ${c}, glossed`} />
      </div>
      {verses === null && <p className="muted">Setting the page…</p>}
      {verses && verses.length === 0 && <p className="muted">No text for that chapter in this edition.</p>}
      {verses && verses.length > 0 && (
        <article className="gl-page" aria-label={`${info.name} ${c} with the Glossa Ordinaria`}>
          <h2 className="gl-title"><span className="gl-rubric">{info.name}</span> <span className="gl-chap">{c}</span></h2>
          {verses.map((v, i) => {
            const ns = notes?.[v.n] ?? [];
            const side = (i + (ns.length ? 0 : 1)) % 2 === 0 ? 'left' : 'right';
            return (
              <div key={v.n} className={`gl-row${ns.length ? ' has-note' : ''} side-${side}`}>
                {ns.length > 0 && <aside className="gl-note gl-note-wide" aria-label={`Gloss on verse ${v.n}`}>{ns.map((g, k) => <p key={k}>{g.en}{latin && g.la && <span className="gl-la" lang="la">{g.la}</span>}</p>)}</aside>}
                <p className="gl-verse"><span className="gl-num">{v.n}</span> {v.text}</p>
                {ns.length > 0 && (
                  <div className="gl-note gl-note-narrow">
                    <button className="gl-toggle" aria-expanded={!!open[v.n]} onClick={() => setOpen((o) => ({ ...o, [v.n]: !o[v.n] }))}>{open[v.n] ? 'Hide the gloss' : 'The gloss'}</button>
                    {open[v.n] && ns.map((g, k) => <p key={k}>{g.en}{latin && g.la && <span className="gl-la" lang="la">{g.la}</span>}</p>)}
                  </div>
                )}
              </div>
            );
          })}
        </article>
      )}
      {notes && <p className="muted small">{total ? `${total} gloss${total === 1 ? '' : 'es'} on this chapter.` : 'The Glossa has nothing on this chapter in the data this app holds.'} The English is a translation made for this app from the Latin; the Latin is shown beside it on request. A gloss is a medieval scholar’s comment, not a statement of Church teaching. Notes are placed on the verse they belong to in the modern numbering.</p>}
      <p className="small no-print"><Link to={`/read/webc/${book}/${c}`}>Read this chapter plainly</Link> · <Link to={`/study/conversation?ref=${book}.${c}.1`}>This chapter across the centuries</Link></p>
    </div>
  );
}
