import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { askCatechism, questionTerms, type Answer } from '../../study/ask';
import { scriptureIndex } from '../../search/engine';
import { useEditions } from '../../data/EditionsContext';
import { useSettings } from '../../lib/store';
import { BOOK_BY_ID } from '../../lib/canon';
import { loadWork } from '../../lib/fathersEngine';
import type { Hit, SearchResult } from '../../lib/fathersSearch';
import { HitCard, Loading, useEngine } from './AskFathersPage';

interface Verse { id: string; b: string; c: number; v: number; t: string }
const clip = (t: string, n = 420) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);

/** One question, every kind of source kept apart and labelled: the Church's teaching, the Bible text, the Fathers and saints, and the app's own definitions. It matches words; it never writes an answer. */
function Tag({ children }: { children: string }) { return <span className="chip small ask-tag">{children}</span>; }

export default function AskAllPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [text, setText] = useState(q);
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition === 'vulgate' ? 'webc' : s.defaultEdition) ?? editions[0];
  const [ccc, setCcc] = useState<Answer | null>(null);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [vErr, setVErr] = useState('');
  const [fathers, setFathers] = useState<SearchResult | null>(null);
  const [wantFathers, setWantFathers] = useState(false);
  const eng = useEngine();

  useEffect(() => {
    setCcc(null); setVerses(null); setVErr(''); setFathers(null);
    if (!q.trim()) return;
    let live = true;
    askCatechism(q).then((a) => live && setCcc(a)).catch(() => live && setCcc({ terms: [], paras: [], topics: [] }));
    if (ed) {
      scriptureIndex(ed).then((ms) => {
        const terms = questionTerms(q);
        if (!terms.length) return live && setVerses([]);
        const hits = ms.search(terms.join(' '), { combineWith: 'OR', prefix: false });
        const need = terms.length >= 2 ? Math.max(2, Math.ceil(terms.length * 0.6)) : 1;
        const best = hits.filter((h) => h.terms.length >= need).slice(0, 5).map((h) => ({ id: String(h.id), b: String(h.b), c: Number(h.c), v: Number(h.v), t: String(h.t) }));
        if (live) setVerses(best);
      }).catch(() => live && setVErr('The Bible text is not on this device yet.'));
    }
    return () => { live = false; };
  }, [q, ed?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!wantFathers || !q.trim() || !eng.eng) return;
    let live = true;
    eng.eng.search(q, loadWork, { bands: [], groups: [], authorIds: [] }).then((r) => live && setFathers(r)).catch(() => {});
    return () => { live = false; };
  }, [wantFathers, q, eng.eng]);

  const ask = (t: string) => { const v = t.trim(); setText(v); setWantFathers(false); setSp(v ? { q: v } : {}); };
  const topFathers: Hit[] = fathers?.hits.slice(0, 3) ?? [];
  const nothing = ccc && !ccc.paras.length && !ccc.topics.length && !ccc.glossary && verses && !verses.length;

  return (
    <div className="page ask-all">
      <h1>Ask the sources</h1>
      <p className="lede">Type a question in plain words. This finds what each kind of source says and keeps them apart, so you can see whose words you are reading. It does not write an answer.</p>
      <form className="rowform" onSubmit={(e) => { e.preventDefault(); ask(text); }} role="search">
        <label className="sr-only" htmlFor="aa-q">Your question</label>
        <input id="aa-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="Why do Catholics baptize infants?" enterKeyHint="search" />
        <button className="btn primary" type="submit">Find</button>
      </form>

      {q && !ccc && <div className="center-note" role="status">Searching…</div>}
      {nothing && <p className="muted">Nothing matched those words. Try plainer or older words (for example “baptism” rather than “christening”).</p>}

      {ccc?.glossary && (
        <section className="card" aria-label="Definition">
          <p className="row" style={{ gap: 8 }}><Tag>Written for this app</Tag><strong>{ccc.glossary.term}</strong></p>
          <p>{ccc.glossary.definition}</p>
          <p className="small"><Link to={`/study/glossary?t=${encodeURIComponent(ccc.glossary.term)}`}>Open in the glossary</Link></p>
        </section>
      )}

      {ccc && ccc.paras.length > 0 && (
        <section className="card" aria-label="The Church’s teaching">
          <h2 className="card-title">The Church’s own words</h2>
          <p className="row" style={{ gap: 8 }}><Tag>Catechism of the Catholic Church</Tag><span className="muted small">official teaching, quoted</span></p>
          {ccc.paras.slice(0, 4).map((p) => <blockquote key={p.n}><Link to={`/study/catechism/${p.n}`}><strong>§{p.n}</strong></Link> {clip(p.text)}</blockquote>)}
          {ccc.topics.length > 0 && <p className="small">Related topics: {ccc.topics.map((t, i) => <span key={t.id}>{i ? ', ' : ''}<Link to={`/study/topics/${t.id}`}>{t.title}</Link></span>)}.</p>}
        </section>
      )}

      {q && (
        <section className="card" aria-label="Scripture">
          <h2 className="card-title">Scripture</h2>
          <p className="row" style={{ gap: 8 }}><Tag>Bible text</Tag><span className="muted small">{ed?.name}; verses that use your words, not an interpretation</span></p>
          {!verses && !vErr && <p className="muted" role="status">Searching the Bible…</p>}
          {vErr && <p className="muted">{vErr}</p>}
          {verses?.length === 0 && <p className="muted">No verse uses enough of your words.</p>}
          {verses?.map((v) => <blockquote key={v.id}><Link to={`/read/${ed!.id}/${v.b}/${v.c}?v=${v.v}`}><strong>{BOOK_BY_ID[v.b]?.name ?? v.b} {v.c}:{v.v}</strong></Link> {v.t}</blockquote>)}
        </section>
      )}

      {q && (
        <section className="card" aria-label="The Fathers and saints">
          <h2 className="card-title">The Fathers and saints</h2>
          <p className="row" style={{ gap: 8 }}><Tag>Writings in the library</Tag><span className="muted small">individual writers, not Church teaching</span></p>
          {!wantFathers && <button className="btn" onClick={() => { setWantFathers(true); eng.start(); }}>Search the library too (loads about 10 MB, once)</button>}
          {wantFathers && !eng.eng && !eng.error && <Loading progress={eng.progress} />}
          {eng.error && <p className="notice" role="alert">{eng.error}</p>}
          {fathers && topFathers.length === 0 && <p className="muted">The library has little on this.</p>}
          {topFathers.map((h) => <HitCard key={`${h.workId}-${h.sectionIdx}`} h={h} words={fathers!.words} />)}
          {fathers && fathers.hits.length > 3 && <p className="small"><Link to={`/study/ask-fathers?q=${encodeURIComponent(q)}`}>See all {fathers.hits.length} passages, by century</Link></p>}
        </section>
      )}
      <p className="muted small">Every card names its kind of source. The Catechism and the Bible are quoted as they stand; the Fathers are single writers, whose views can differ; the definition is explained in this app’s own words.</p>
    </div>
  );
}
