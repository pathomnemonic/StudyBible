import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadEngine, loadWork, onEngineProgress } from '../../lib/fathersEngine';
import { CENTURIES, EXAMPLE_QUESTIONS, GROUPS, highlight, type CenturyBand, type FathersEngine, type Group, type Hit, type SearchResult } from '../../lib/fathersSearch';

export function Marked({ text, words }: { text: string; words: string[] }) {
  return <>{highlight(text, words).map((s, i) => (s.hit ? <mark key={i}>{s.t}</mark> : <span key={i}>{s.t}</span>))}</>;
}
const clip = (t: string, n = 700) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);

export function useEngine() {
  const [eng, setEng] = useState<FathersEngine | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => { const off = onEngineProgress(setProgress); return off; }, []);
  const start = () => { setError(''); loadEngine().then(setEng).catch((e) => setError(String(e.message ?? e))); };
  return { eng, progress, error, start };
}
export function Loading({ progress }: { progress: number }) {
  return (
    <div className="center-note" role="status" aria-live="polite">
      Loading the library’s word index (about 10 MB, once){progress > 0 ? ` ${Math.round(progress * 100)}%` : '…'}
      {progress > 0 && <div className="af-bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
    </div>
  );
}

export default function AskFathersPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [text, setText] = useState(q);
  const { eng, progress, error, start } = useEngine();
  const [res, setRes] = useState<SearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [bands, setBands] = useState<CenturyBand[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [author, setAuthor] = useState('');
  const [byCentury, setByCentury] = useState(true);

  useEffect(() => { if (q) start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!q || !eng) return;
    let live = true;
    setBusy(true);
    eng.search(q, loadWork, { bands, groups, authorIds: author ? [author] : [] }).then((r) => { if (live) { setRes(r); setBusy(false); } }).catch(() => live && setBusy(false));
    return () => { live = false; };
  }, [q, eng, bands, groups, author]);

  const ask = (s: string) => { const t = s.trim(); setText(t); if (t) { start(); setSp({ q: t }); } };
  const authors = useMemo(() => eng?.authors(['Fathers', 'Saints', 'Councils', 'Church documents']) ?? [], [eng]);
  const toggle = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);

  const sections = useMemo(() => {
    const hits = res?.hits ?? [];
    if (!byCentury) return [{ label: 'Best matches first', hits }];
    return [...CENTURIES, null].map((b) => ({ label: b ? `${b} century` : 'Date unknown', hits: hits.filter((h) => h.band === b) })).filter((s) => s.hits.length);
  }, [res, byCentury]);

  return (
    <div className="page ask-fathers">
      <h1>Ask the Fathers</h1>
      <p className="muted">Type a question in plain words. This finds what the Fathers and other writers in the library actually wrote on it, in their own words. It does not answer for them, and it is not an answer from the Church.</p>
      <form className="rowform" onSubmit={(e) => { e.preventDefault(); ask(text); }} role="search">
        <label className="sr-only" htmlFor="af-q">Your question</label>
        <input id="af-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="Why do we baptize infants?" enterKeyHint="search" />
        <button className="btn primary" type="submit">Find</button>
      </form>
      <div className="af-chips" aria-label="Example questions">
        {EXAMPLE_QUESTIONS.map((x) => <button key={x} type="button" className="chip" onClick={() => ask(x)}>{x}</button>)}
      </div>

      {error && <div className="center-note error" role="alert">{error} <button className="btn" onClick={start}>Try again</button></div>}
      {q && !eng && !error && <Loading progress={progress} />}

      {eng && q && (
        <>
          <details className="af-filters">
            <summary>Filters{bands.length + groups.length + (author ? 1 : 0) ? ` (${bands.length + groups.length + (author ? 1 : 0)} on)` : ''}</summary>
            <div className="af-row" role="group" aria-label="Century">{CENTURIES.map((b) => <button key={b} className={`chip${bands.includes(b) ? ' sel' : ''}`} aria-pressed={bands.includes(b)} onClick={() => setBands(toggle(bands, b))}>{b}</button>)}</div>
            <div className="af-row" role="group" aria-label="Kind of writer">{GROUPS.map((g) => <button key={g} className={`chip${groups.includes(g) ? ' sel' : ''}`} aria-pressed={groups.includes(g)} onClick={() => setGroups(toggle(groups, g))}>{g}</button>)}</div>
            <label className="af-row">Author <select value={author} onChange={(e) => setAuthor(e.target.value)}><option value="">Anyone</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label className="af-row"><input type="checkbox" checked={byCentury} onChange={(e) => setByCentury(e.target.checked)} /> Group by century</label>
          </details>
          {busy && <div className="center-note" role="status">Searching…</div>}
          {!busy && res && (
            <>
              {res.unmatchedWords.length > 0 && res.matchedWords.length > 0 && <p className="muted small">Not found in the library: {res.unmatchedWords.join(', ')}. Showing the rest.</p>}
              {res.hits.length === 0 && <p className="af-little">The library has little on this, or the words differ. Try plainer or older words (for example “baptism” rather than “christening”), or remove a filter. Words under four letters are not searched. The library is a selection of public-domain translations, not everything the Fathers wrote.</p>}
              {res.hits.length > 0 && res.hits.length < 4 && <p className="af-little">Only a few passages. The library has little on this.</p>}
              {sections.map((s) => (
                <section key={s.label} className="af-group">
                  <h2 className="eyebrow-h">{s.label}</h2>
                  {s.hits.map((h) => <HitCard key={`${h.workId}-${h.sectionIdx}`} h={h} words={res.words} />)}
                </section>
              ))}
              {res.hits.length > 0 && <p className="muted small">Ranked by how many of your words a passage uses and how rare they are, with the Fathers’ own writings lifted slightly over later catechisms. At most three passages per author. Open a passage to read it in context.</p>}
            </>
          )}
        </>
      )}
    </div>
  );
}

export function HitCard({ h, words }: { h: Hit; words: string[] }) {
  return (
    <article className="card af-hit">
      <h3>{h.author}</h3>
      <p className="muted small">{h.workTitle}: {h.sectionTitle.length > 90 ? `${h.sectionTitle.slice(0, 90)}…` : h.sectionTitle}<br />{h.yearText}{h.yearText ? ' · ' : ''}{h.band ? `${h.band} century · ` : ''}{h.group}</p>
      {h.passages.map((p) => <blockquote key={p.para}><Marked text={clip(p.text)} words={words} /></blockquote>)}
      <Link className="chip" to={h.href}>Read in context</Link>
    </article>
  );
}
