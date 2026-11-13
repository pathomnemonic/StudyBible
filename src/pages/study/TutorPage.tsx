import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { loadChains } from '../../chains/load';
import type { Chain, Step } from '../../chains/types';

const KIND: Record<string, string> = { scripture: 'Scripture', father: 'A Father of the Church', council: 'A council', catechism: 'The Catechism', magisterium: 'Church teaching', saint: 'A saint', liturgy: 'The liturgy', writer: 'A writer' };

/** A guided way through one argument: think first, then see each source in turn and why it matters. No generated text: every line is the chain's own. */
export default function TutorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [chains, setChains] = useState<Chain[] | null>(null);
  const [mine, setMine] = useState('');
  const [stage, setStage] = useState(0);        // 0 question; 1..n sources; then objections; then done
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { loadChains('arguments').then(setChains); }, []);
  const chain = useMemo(() => chains?.find((c) => c.id === id), [chains, id]);
  useEffect(() => { setMine(''); setStage(0); setShown({}); setSaved(false); }, [id]);

  if (!chains) return <div className="page"><p className="muted" role="status">Loading…</p></div>;
  if (!chain) {
    return (
      <div className="page">
        <h1>Think it through</h1>
        <p className="lede">Pick a question. You say what you think first, then meet the sources one at a time and see why each matters. Everything shown is from the Argument Map; nothing is written for you on the spot.</p>
        <ul className="list">{chains.map((c) => <li key={c.id}><Link to={`/study/tutor/${c.id}`}><strong>{c.question}</strong></Link> <span className="muted small">{c.title}</span></li>)}</ul>
      </div>
    );
  }
  const steps = chain.steps;
  const objections = chain.objections ?? [];
  const total = steps.length + objections.length;
  const done = stage > total;
  const step: Step | undefined = stage >= 1 && stage <= steps.length ? steps[stage - 1] : undefined;
  const objection = stage > steps.length && stage <= total ? objections[stage - steps.length - 1] : undefined;
  const saveMine = async () => {
    const body = mine.trim();
    if (!body) return;
    await db.notes.add({ kind: 'study', title: `My answer: ${chain.question}`, body, targets: [], tags: [`argument:${chain.id}`], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() } as never);
    setSaved(true);
  };
  return (
    <div className="page tutor">
      <p className="small"><Link to="/study/tutor">← All questions</Link></p>
      <h1>{chain.question}</h1>
      <p className="muted small" aria-live="polite">{done ? 'Finished' : stage === 0 ? 'Start by thinking' : `Step ${Math.min(stage, total)} of ${total}`}</p>

      {stage === 0 && (
        <section className="card">
          <h2 className="card-title">What do you think?</h2>
          <p>Before you look at any source, say in a sentence or two what you would answer, and why.</p>
          <textarea value={mine} onChange={(e) => setMine(e.target.value)} rows={4} style={{ width: '100%' }} aria-label="Your answer" placeholder="I think…" />
          <p><button className="btn primary" onClick={() => setStage(1)}>Show me the first source</button></p>
        </section>
      )}

      {step && (
        <section className="card" aria-label={`Source ${stage}`}>
          <p><span className="chip small">{KIND[step.kind] ?? step.kind}</span> <strong>{step.label}</strong>{step.when ? <span className="muted small"> · {step.when}</span> : null}</p>
          <p>{step.note}</p>
          {!shown[`s${stage}`]
            ? <button className="btn" onClick={() => setShown({ ...shown, [`s${stage}`]: true })}>Show the words themselves</button>
            : <blockquote>“{step.quote}”</blockquote>}
          <p className="row" style={{ gap: 8 }}>
            {stage > 1 && <button className="btn small ghost" onClick={() => setStage(stage - 1)}>Back</button>}
            <button className="btn primary" onClick={() => setStage(stage + 1)}>{stage < total ? 'Next' : 'Finish'}</button>
          </p>
        </section>
      )}

      {objection && (
        <section className="card" aria-label="An objection">
          <h2 className="card-title">But someone might say…</h2>
          <p><strong>{objection.q}</strong></p>
          <p className="muted small">Think of how you would reply, then look.</p>
          {!shown[`o${stage}`]
            ? <button className="btn" onClick={() => setShown({ ...shown, [`o${stage}`]: true })}>Show the reply</button>
            : <p>{objection.a}</p>}
          <p className="row" style={{ gap: 8 }}>
            <button className="btn small ghost" onClick={() => setStage(stage - 1)}>Back</button>
            <button className="btn primary" onClick={() => setStage(stage + 1)}>{stage < total ? 'Next' : 'Finish'}</button>
          </p>
        </section>
      )}

      {done && (
        <section className="card">
          <h2 className="card-title">The answer in brief</h2>
          <p>{chain.summary}</p>
          {mine.trim() && (
            <>
              <h3>What you thought at the start</h3>
              <blockquote>{mine}</blockquote>
              <p><button className="btn" onClick={() => void saveMine()} disabled={saved}>{saved ? 'Saved to your notes ✓' : 'Keep my answer as a note'}</button></p>
            </>
          )}
          <p className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn" to={`/study/arguments/${chain.id}`}>See the whole chain</Link>
            <button className="btn" onClick={() => { setStage(0); setShown({}); }}>Go through it again</button>
            <button className="btn ghost" onClick={() => nav('/study/tutor')}>Pick another question</button>
          </p>
        </section>
      )}
    </div>
  );
}
