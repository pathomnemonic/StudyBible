import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { GLOSSARY, type GlossaryEntry } from '../../data/glossary';
import { cccRange, type CccPara } from '../../data/ccc';
import { cccList, getGrade, flatLessons } from '../../curriculum/model';
import { loadChains } from '../../chains/load';
import { MODES, type Chain, type ChainMode } from '../../chains/types';
import ShareLinkButton from '../../components/ShareLinkButton';

const LEVELS = ['One sentence', 'A paragraph', 'A page', 'The sources', 'Go deeper'] as const;
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sentences = (t: string, n: number) => (t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [t]).slice(0, n).join('').trim();

interface Hit { id: string; title: string; band: string; idea: string }

/** One teaching at five distances: a sentence, a paragraph, a page, the sources behind it, and where to read on. */
export default function ZoomPage() {
  const { term } = useParams();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const g: GlossaryEntry | undefined = useMemo(() => GLOSSARY.find((x) => slug(x.term) === term), [term]);
  const [level, setLevel] = useState(1);
  const [para, setPara] = useState<CccPara | null>(null);
  const [around, setAround] = useState<CccPara[]>([]);
  const [lessons, setLessons] = useState<Hit[]>([]);
  const [chains, setChains] = useState<(Chain & { mode: ChainMode })[]>([]);

  useEffect(() => {
    if (!g) return;
    setLevel(1); setPara(null); setAround([]); setLessons([]); setChains([]);
    cccRange(g.ccc, g.ccc + 4).then((ps) => { setPara(ps.find((p) => p.n === g.ccc) ?? null); setAround(ps); });
    getGrade('YA').then((gr) => {
      if (!gr) return;
      setLessons(flatLessons(gr).filter((l) => cccList(l.ccc).some((n) => Math.abs(n - g.ccc) <= 1)).slice(0, 4).map((l) => ({ id: l.id, title: l.title, band: 'Adults', idea: l.idea })));
    });
    Promise.all((['arguments', 'development', 'heresies', 'words'] as ChainMode[]).map((m) => loadChains(m).then((cs) => cs.map((c) => ({ ...c, mode: m }))))).then((all) =>
      setChains(all.flat().filter((c) => [...c.steps, ...(c.objections ?? []).flatMap((o) => o.steps ?? [])].some((s) => s.ccc && Math.abs(s.ccc - g.ccc) <= 3) || (c.readNext ?? []).some((n) => Math.abs(n - g.ccc) <= 3)).slice(0, 5)));
  }, [g]);

  if (!g) {
    const f = q.trim().toLowerCase();
    const list = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).filter((x) => !f || `${x.term} ${x.aliases.join(' ')}`.toLowerCase().includes(f));
    return (
      <div className="page">
        <h1>Doctrine at different distances</h1>
        <p className="lede">Pick a teaching and zoom: one sentence, a paragraph, a page, the sources behind it, then where to read on.</p>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a teaching" aria-label="Find a teaching" />
        <ul className="list chain-list">{list.map((x) => <li key={x.term}><Link className="t" to={`/study/zoom/${slug(x.term)}`}>{x.term}</Link><p className="muted small" style={{ margin: '2px 0 0' }}>{sentences(x.definition, 1)}</p></li>)}</ul>
        {term && <p className="callout">We couldn’t find “{term}”. Pick a teaching from the list.</p>}
      </div>
    );
  }
  return (
    <div className="page zoom">
      <p className="small no-print"><Link to="/study/zoom">← All teachings</Link></p>
      <h1>{g.term}</h1>
      <div className="seg zoom-seg no-print" role="group" aria-label="How close to look">
        {LEVELS.map((l, i) => <button key={l} className={`chip${level === i + 1 ? ' sel' : ''}`} aria-pressed={level === i + 1} onClick={() => setLevel(i + 1)}>{i + 1}. {l}</button>)}
      </div>
      <input className="zoom-range no-print" type="range" min={1} max={5} value={level} onChange={(e) => setLevel(+e.target.value)} aria-label="Zoom level" />

      <section className="card zoom-1"><p className="zoom-sentence">{g.definition}</p></section>
      {level >= 2 && <section className="card" aria-label="In a paragraph">
        <h2 className="chain-h2" style={{ marginTop: 0 }}>In a paragraph</h2>
        {para ? <blockquote className="chain-quote"><p>{sentences(para.t, 4)}</p></blockquote> : <p className="muted">Loading the Catechism…</p>}
        <p className="small"><Link to={`/study/catechism/${g.ccc}`}>Catechism §{g.ccc}</Link>{g.near && ' (the nearest paragraph on this topic; it does not name the term)'}</p>
      </section>}
      {level >= 3 && <section className="card" aria-label="In a page">
        <h2 className="chain-h2" style={{ marginTop: 0 }}>In a page</h2>
        {around.map((p) => <p key={p.n}><sup className="muted">{p.n}</sup> {p.t}</p>)}
        {lessons.length > 0 && <>
          <h3 className="chain-label">How the course teaches it</h3>
          <ul className="list">{lessons.map((l) => <li key={l.id}><Link to={`/study/curriculum/YA/${l.id}`}>{l.title}</Link><p className="muted small" style={{ margin: '2px 0 0' }}>{l.idea}</p></li>)}</ul>
        </>}
      </section>}
      {level >= 4 && <section className="card" aria-label="The sources">
        <h2 className="chain-h2" style={{ marginTop: 0 }}>The sources behind it</h2>
        {chains.length > 0 ? <ul className="list">{chains.map((c) => <li key={c.mode + c.id}><Link to={`${MODES[c.mode].path}/${c.id}`}>{c.title}</Link> <span className="muted small">· {MODES[c.mode].title}</span><p className="muted small" style={{ margin: '2px 0 0' }}>{c.summary}</p></li>)}</ul>
          : <p className="muted">No source chain for this teaching yet. The Catechism’s own footnotes are listed with these paragraphs.</p>}
        {around.some((p) => p.fn?.length) && <details><summary>Footnotes in these paragraphs</summary><ul className="small">{around.flatMap((p) => p.fn ?? []).slice(0, 12).map((f) => <li key={f.id}>{f.t}</li>)}</ul></details>}
      </section>}
      {level >= 5 && <section className="card" aria-label="Go deeper">
        <h2 className="chain-h2" style={{ marginTop: 0 }}>Go deeper</h2>
        <ul className="list">
          <li><Link to={`/study/catechism/${g.ccc}`}>The Catechism, from §{g.ccc}</Link></li>
          <li><Link to="/study/compare">Compare the Catechism, documents and Fathers on a doctrine</Link></li>
          <li><Link to={`/study/ask?q=${encodeURIComponent(g.term)}`}>Ask the Catechism about {g.term.toLowerCase()}</Link></li>
          <li><Link to={`/study/glossary?t=${encodeURIComponent(g.term)}`}>In the glossary</Link></li>
        </ul>
      </section>}
      <p className="no-print"><ShareLinkButton path={`/study/zoom/${slug(g.term)}`} title={g.term} /></p>
    </div>
  );
}
