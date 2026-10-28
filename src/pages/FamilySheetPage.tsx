import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { readingsFor } from '../liturgy/readings';
import { liturgicalDay, parseIso } from '../liturgy/compute';
import { passageText } from '../lib/bibleText';
import { formatRef } from '../lib/refs';
import { LEVELS, actionFor, genreOf, questionsFor, quoteOf } from '../lib/familySheet';
import PrintButton from '../components/PrintButton';

const pad = (n: number) => String(n).padStart(2, '0');
const nextSunday = (from = new Date()) => { const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate() + ((7 - from.getDay()) % 7))); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

/** A one-page sheet for talking about Sunday's Gospel at the table: the reading, questions for three ages, and one thing to do this week. */
export default function FamilySheetPage() {
  const [sp, setSp] = useSearchParams();
  const date = sp.get('d') ?? nextSunday();
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const edition = get(s.defaultEdition) ?? editions[0];
  const [gospel, setGospel] = useState<{ ref: string; verses: { v: number; text: string }[] } | null | undefined>(undefined);
  useEffect(() => {
    if (!edition) return;
    let live = true;
    setGospel(undefined);
    readingsFor(s.diocese, date).then(async (r) => {
      const it = r.items.find((x) => x.slot === 'gospel');
      if (!it || !it.refs.length) return live && setGospel(null);
      const verses = (await passageText(edition, it.refs[0], 40)).map((x) => ({ v: x.v, text: x.text }));
      if (live) setGospel({ ref: it.text, verses });
    }).catch(() => live && setGospel(null));
    return () => { live = false; };
  }, [date, edition?.id, s.diocese]); // eslint-disable-line react-hooks/exhaustive-deps
  const ld = liturgicalDay(parseIso(date), s.diocese === 'US' ? 'usa' : 'universal');
  const full = gospel ? gospel.verses.map((v) => v.text).join(' ') : '';
  const genre = genreOf(full);
  const quote = quoteOf(full);
  return (
    <div className="page family-sheet">
      <div className="row between no-print"><h1>Family Gospel sheet</h1><div className="row" style={{ gap: 8 }}><input type="date" value={date} aria-label="Pick a Sunday" onChange={(e) => e.target.value && setSp({ d: e.target.value }, { replace: true })} /><PrintButton label="Print" className="btn small primary" /></div></div>
      <div className="print-sheet fs-sheet">
        <h2 style={{ margin: '0 0 2px' }}>{ld.dayName}</h2>
        <p className="muted small" style={{ margin: 0 }}>{new Date(date + 'T12:00:00Z').toLocaleDateString(undefined, { dateStyle: 'full', timeZone: 'UTC' })}{gospel ? ` · Gospel: ${gospel.ref}` : ''}</p>
        {gospel === undefined && <p className="muted">Loading the Gospel…</p>}
        {gospel === null && <p className="muted">The Gospel for this day is not listed offline. Pick another Sunday, or <Link to="/pray/readings">open the readings</Link>.</p>}
        {gospel && (
          <>
            <h3>Read it aloud together</h3>
            <blockquote className="fs-text">{gospel.verses.map((v) => <span key={v.v}><sup>{v.v}</sup> {v.text} </span>)}</blockquote>
            {quote && <p className="fs-quote">Words to remember: “{quote}”</p>}
            {LEVELS.map((l) => (
              <section key={l.id} className="fs-level">
                <h3>{l.title}</h3>
                <ol>{questionsFor(genre, l.id).map((q, i) => <li key={i}>{q}</li>)}</ol>
              </section>
            ))}
            <h3>This week</h3>
            <p>{actionFor(genre)}</p>
            <p className="muted small">Close with the Sign of the Cross and an Our Father.</p>
          </>
        )}
      </div>
    </div>
  );
}
