import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { askCatechism, type Answer } from '../../study/ask';

const EXAMPLES = ['Why do Catholics confess to a priest?', 'What is purgatory?', 'Why do we baptize babies?', 'Do Catholics worship Mary?', 'What happens at Mass?', 'Why does God allow suffering?'];

/** Ask a plain question; get the Catechism's own paragraphs that speak to it. It matches words, it does not interpret, and it never makes up an answer. */
export default function AskPage() {
  const [sp, setSp] = useSearchParams();
  const asked = sp.get('q') ?? '';
  const [q, setQ] = useState(asked);
  const [ans, setAns] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState<number | null>(null);
  useEffect(() => {
    setQ(asked); setMore(null);
    if (!asked.trim()) { setAns(null); return; }
    let live = true;
    setBusy(true);
    askCatechism(asked).then((a) => { if (live) { setAns(a); setBusy(false); } });
    return () => { live = false; };
  }, [asked]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) setSp({ q: q.trim() }, { replace: true }); };
  const snip = (t: string) => (t.length > 320 ? `${t.slice(0, 320).replace(/\s+\S*$/, '')}…` : t);
  return (
    <div className="page ask">
      <h1>Ask the Catechism</h1>
      <form className="rowform" role="search" onSubmit={submit}>
        <label className="sr-only" htmlFor="ask-q">Your question</label>
        <input id="ask-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask in your own words" autoFocus={!asked} />
        <button className="btn primary" type="submit" disabled={!q.trim()}>Ask</button>
      </form>
      {!asked && <div className="chips" aria-label="Examples" style={{ marginTop: 10 }}>{EXAMPLES.map((x) => <button key={x} className="chip" onClick={() => setSp({ q: x })}>{x}</button>)}</div>}
      {busy && <div className="center-note">Reading the Catechism…</div>}
      {ans && !busy && (
        <>
          {ans.glossary && (
            <section className="card" aria-label="Definition">
              <strong>{ans.glossary.term}</strong>
              <p style={{ margin: '4px 0' }}>{ans.glossary.definition}</p>
              <Link className="chip" to={`/study/catechism/${ans.glossary.ccc}`}>Catechism §{ans.glossary.ccc}</Link>
            </section>
          )}
          {ans.paras.length > 0 && <h2 className="eyebrow-h">What the Catechism says</h2>}
          <ul className="list">
            {ans.paras.map((p) => (
              <li key={p.n}>
                <p style={{ margin: '0 0 4px' }}>{more === p.n ? p.text : snip(p.text)}{p.text.length > 320 && <> <button className="btn small ghost" onClick={() => setMore(more === p.n ? null : p.n)}>{more === p.n ? 'Less' : 'More'}</button></>}</p>
                <Link className="chip" to={`/study/catechism/${p.n}`}>Catechism §{p.n}</Link>
              </li>
            ))}
          </ul>
          {ans.topics.length > 0 && (
            <>
              <h2 className="eyebrow-h">Related topics</h2>
              <div className="chips">{ans.topics.map((t) => <Link key={t.id} className="chip" to={`/study/topics/${t.id}`} title={t.summary}>{t.title}</Link>)}</div>
            </>
          )}
          {!ans.paras.length && !ans.glossary && !ans.topics.length && <p className="muted">Nothing matched. Try other words, for example “baptism” or “Eucharist”.</p>}
          <p className="muted small">These are the Catechism’s own words, found by matching your words. For a full answer, read the paragraph and the ones around it.</p>
        </>
      )}
    </div>
  );
}
