import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { loadWork } from '../../lib/fathersEngine';
import { compareAuthors, type Comparison } from '../../lib/fathersSearch';
import { HitCard, Loading, useEngine } from './AskFathersPage';

const TOPICS = ['baptism', 'the Eucharist', 'martyrdom', 'prayer', 'the poor', 'the bishop', 'Mary the Virgin', 'fasting', 'sin and forgiveness'];

export default function CompareFathersPage() {
  const [sp, setSp] = useSearchParams();
  const a = sp.get('a') ?? 'augustine', b = sp.get('b') ?? 'chrysostom', q = sp.get('q') ?? '';
  const [text, setText] = useState(q);
  const { eng, progress, error, start } = useEngine();
  const [cmp, setCmp] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const authors = useMemo(() => eng?.authors(['Fathers', 'Saints']) ?? [], [eng]);
  const name = (id: string) => authors.find((x) => x.id === id)?.name ?? id;
  useEffect(() => {
    if (!eng || !q) return;
    let live = true;
    setBusy(true);
    compareAuthors(eng, q, a, b, loadWork).then((c) => { if (live) { setCmp(c); setBusy(false); } }).catch(() => live && setBusy(false));
    return () => { live = false; };
  }, [eng, q, a, b]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); n.set(k, v); setSp(n); };
  const go = (s: string) => { setText(s); if (s.trim()) set('q', s.trim()); };

  return (
    <div className="page ask-fathers compare-fathers">
      <h1>Compare two Fathers</h1>
      <p className="muted">Pick two writers and a topic. You see the best passage each wrote on it, side by side. Nothing is summarised or interpreted for you.</p>
      <div className="af-pick">
        <label>First writer <select value={a} onChange={(e) => set('a', e.target.value)}>{authors.length ? authors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value={a}>{a}</option>}</select></label>
        <label>Second writer <select value={b} onChange={(e) => set('b', e.target.value)}>{authors.length ? authors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value={b}>{b}</option>}</select></label>
      </div>
      <form className="rowform" onSubmit={(e) => { e.preventDefault(); go(text); }} role="search">
        <label className="sr-only" htmlFor="cf-q">Topic or question</label>
        <input id="cf-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="baptism, or: Is the Eucharist the body of Christ?" />
        <button className="btn primary" type="submit">Compare</button>
      </form>
      <div className="af-chips">{TOPICS.map((t) => <button key={t} type="button" className="chip" onClick={() => go(t)}>{t}</button>)}</div>
      {error && <div className="center-note error" role="alert">{error} <button className="btn" onClick={start}>Try again</button></div>}
      {!eng && !error && <Loading progress={progress} />}
      {busy && <div className="center-note" role="status">Reading both…</div>}
      {a === b && <p className="af-little">Choose two different writers.</p>}
      {cmp && !busy && a !== b && (
        <>
          <div className="af-sides">
            {[{ id: a, hits: cmp.a }, { id: b, hits: cmp.b }].map((s) => (
              <div key={s.id} className="af-side">
                <h2 className="eyebrow-h">{name(s.id)}</h2>
                {s.hits.length === 0 && <p className="af-little">Nothing by {name(s.id)} in the library uses these words. Try a plainer word.</p>}
                {s.hits.slice(0, 2).map((h) => <HitCard key={`${h.workId}-${h.sectionIdx}`} h={h} words={cmp.words} />)}
                {s.hits.length > 2 && <Link className="muted small" to={`/study/ask-fathers?q=${encodeURIComponent(q)}`}>More in Ask the Fathers</Link>}
              </div>
            ))}
          </div>
          {cmp.a.length > 0 && cmp.b.length > 0 && (
            <aside className="card af-counts" aria-label="Counts only">
              <h2 className="eyebrow-h">A count, not a verdict</h2>
              <p>The two best passages share <b>{cmp.sharedTerms.length}</b> key word{cmp.sharedTerms.length === 1 ? '' : 's'}{cmp.sharedTerms.length ? `: ${cmp.sharedTerms.slice(0, 10).join(', ')}` : ''}.</p>
              {cmp.yearGap != null && <p>The two works are about <b>{cmp.yearGap}</b> year{cmp.yearGap === 1 ? '' : 's'} apart (by the start of each work’s date range).</p>}
              <p className="muted small">Sharing words does not mean they agree, and different words do not mean they differ. Words are shown in a shortened form. Read both in context before drawing a conclusion.</p>
            </aside>
          )}
        </>
      )}
    </div>
  );
}
