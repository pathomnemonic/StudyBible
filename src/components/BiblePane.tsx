import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, getBook } from '../lib/canon';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { convertRef } from '../lib/versification';
import { parseRefId } from '../lib/refs';

const KEY = 'sb:room:bible';
const load = (): { book: string; c: number } | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } };

/** A Bible chapter that stays open beside whatever else is being read. Chapter numbers are those most Bibles use. */
export default function BiblePane({ suggest }: { suggest?: string[] }) {
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const edition = get(s.defaultEdition) ?? editions[0];
  const fromSuggest = (() => {
    for (const id of suggest ?? []) {
      const r = parseRefId(id);
      if (r) { const k = convertRef('vulgate', 'kjv', { book: r.book, c1: r.c1, c2: r.c1 }).ref; return { book: k.book, c: k.c1 }; }
    }
    return null;
  })();
  const [pos, setPos] = useState<{ book: string; c: number }>(() => fromSuggest ?? load() ?? (s.last ? { book: s.last.book, c: s.last.chapter } : { book: 'JHN', c: 1 }));
  const [verses, setVerses] = useState<{ v: number; text: string }[] | null>(null);
  const key = (suggest ?? []).join(',');
  useEffect(() => { if (fromSuggest) setPos(fromSuggest); }, [key]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* private mode */ } }, [pos]);
  const book = getBook(pos.book);
  useEffect(() => {
    if (!edition) return;
    let live = true;
    setVerses(null);
    const a = convertRef('kjv', 'vulgate', { book: pos.book, c1: pos.c, c2: pos.c }).ref;
    passageText(edition, { ...a, v1: undefined, v2: undefined }, 220).then((t) => live && setVerses(t.map((x) => ({ v: x.v, text: x.text })))).catch(() => live && setVerses([]));
    return () => { live = false; };
  }, [edition?.id, pos.book, pos.c]);
  const step = (d: number) => {
    const n = pos.c + d;
    if (n < 1) { const i = BOOKS.findIndex((b) => b.id === pos.book); if (i > 0) setPos({ book: BOOKS[i - 1].id, c: BOOKS[i - 1].chapters }); }
    else if (n > book.chapters) { const i = BOOKS.findIndex((b) => b.id === pos.book); if (i < BOOKS.length - 1) setPos({ book: BOOKS[i + 1].id, c: 1 }); }
    else setPos({ ...pos, c: n });
  };
  return (
    <section className="bible-pane" aria-label="Bible chapter">
      <div className="bp-bar">
        <select aria-label="Book" value={pos.book} onChange={(e) => setPos({ book: e.target.value, c: 1 })}>{BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select aria-label="Chapter" value={pos.c} onChange={(e) => setPos({ ...pos, c: +e.target.value })}>{Array.from({ length: book.chapters }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
        <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous chapter">‹</button>
        <button className="icon-btn" onClick={() => step(1)} aria-label="Next chapter">›</button>
        {edition && <Link className="small" to={`/read/${edition.id}/${pos.book}/${pos.c}`}>Open in the Bible ↗</Link>}
      </div>
      <div className="bp-text">
        <h3>{book.name} {pos.c} <span className="muted small">{edition?.shortName}</span></h3>
        {!verses && <p className="muted">Loading…</p>}
        {verses?.length === 0 && <p className="muted">This chapter is not in {edition?.shortName}. Try another book or translation.</p>}
        {verses?.map((v) => <p key={v.v} className="bp-v"><sup>{v.v}</sup> {v.text}</p>)}
      </div>
    </section>
  );
}
