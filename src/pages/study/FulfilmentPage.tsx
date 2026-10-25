import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { lensFile } from '../../study/lens';
import { formatRef, parseRefId } from '../../lib/refs';
import { useEditions } from '../../data/EditionsContext';
import { readerPath } from '../../lib/nav';

interface Entry {
  id: string;
  title: string;
  kind?: string;
  note: string;
  ccc?: string[];
  a?: string[];
  b?: string[];
  quotes?: { who: string; work: string; section: number; text: string }[];
}
interface Guide { title: string; note: string; ccc?: string[] }
interface Reading { title: string; author: string; kind: string; note: string; url?: string; internal?: string }

const KINDS: [string, string][] = [['all', 'All'], ['type', 'Types'], ['prophecy', 'Prophecies']];

/** How the New Testament and the Fathers read the Old: types, prophecies and the voices that explain them. */
export default function FulfilmentPage() {
  const [guide, setGuide] = useState<Guide[]>([]);
  const [list, setList] = useState<Entry[]>([]);
  const [reading, setReading] = useState<Reading[]>([]);
  const [kind, setKind] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const { get, editions } = useEditions();
  const ed = get('dra') ?? editions[0];
  useEffect(() => {
    lensFile('guide').then((f) => setGuide((f?.entries ?? []) as unknown as Guide[]));
    lensFile('typology').then((f) => setList((f?.entries ?? []) as unknown as Entry[]));
    lensFile('reading').then((f) => setReading((f?.entries ?? []) as unknown as Reading[]));
  }, []);
  const shown = useMemo(() => list.filter((e) => kind === 'all' || e.kind === kind), [list, kind]);
  const chips = (ids?: string[]) =>
    (ids ?? []).map((id) => {
      const r = parseRefId(id);
      return r ? <Link key={id} className="chip" to={readerPath(ed, r)}>{formatRef(r, { noDual: true })}</Link> : null;
    });
  return (
    <div className="page">
      <h1>Promise and fulfilment</h1>
      <p className="lede">How the New Testament, and the Fathers after it, read the Old: persons and events that point to Christ, promises that are kept, and the voices that explain them.</p>

      <section aria-labelledby="how">
        <h2 id="how" className="h-sm">How it works</h2>
        <div className="fulfill-guide">
          {guide.map((g) => (
            <details key={g.title} className="card">
              <summary>{g.title}</summary>
              <p>{g.note}</p>
              {g.ccc && g.ccc.length > 0 && <p className="muted small">See {g.ccc.join(', ')}.</p>}
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="pairs">
        <h2 id="pairs" className="h-sm">Types and prophecies</h2>
        <div className="chips" style={{ margin: '4px 0 12px' }}>
          {KINDS.map(([k, l]) => <button key={k} className={'chip' + (kind === k ? ' sel' : '')} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        </div>
        <ul className="fulfill-list">
          {shown.map((e) => (
            <li key={e.id} className="card">
              <button className="fulfill-head" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span className="kicker">{e.kind === 'prophecy' ? 'Prophecy' : 'Type'}</span>
                <strong>{e.title}</strong>
                <span className="muted small">{[...(e.b ?? []), ...(e.a ?? [])].slice(0, 3).map((id) => { const r = parseRefId(id); return r ? formatRef(r, { noDual: true }) : ''; }).join(' → ')}</span>
              </button>
              {open === e.id && (
                <div className="fulfill-body">
                  <p>{e.note}</p>
                  {(e.quotes ?? []).map((q) => (
                    <blockquote key={q.text.slice(0, 20)} className="fq-block">
                      <p>{/^[a-z[]/.test(q.text) ? '… ' : '“'}{q.text.replace(/^[“”"]/, '')}”</p>
                      <footer><Link to={`/study/works/${q.work}/${q.section}`}>{q.who}</Link></footer>
                    </blockquote>
                  ))}
                  <p className="small"><strong>Old Testament:</strong> {chips(e.b)}</p>
                  <p className="small"><strong>New Testament:</strong> {chips(e.a)}</p>
                  {e.ccc && e.ccc.length > 0 && <p className="muted small">Catechism: {e.ccc.join(', ')} (check the numbers in the text).</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="muted small">The notes are written for this app. The quotations are word for word from public-domain translations in the library, and are checked against the library text when the data is built. A tradition's reading of a passage is shown, not argued; the Teaching tab has what the Church teaches.</p>
      </section>

      <section aria-labelledby="more">
        <h2 id="more" className="h-sm">Read more</h2>
        <ul className="fulfill-reading">
          {reading.map((r) => (
            <li key={r.title}>
              {r.internal ? <Link to={r.internal}><strong>{r.title}</strong></Link> : <a href={r.url} target="_blank" rel="noreferrer"><strong>{r.title}</strong> ↗</a>}
              <span className="muted small"> · {r.author} · {r.kind}</span>
              <div className="small">{r.note}</div>
            </li>
          ))}
        </ul>
        <p className="muted small">Books, courses and talks that are under copyright are linked, never copied. Public-domain works are in the library.</p>
      </section>
    </div>
  );
}
