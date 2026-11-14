import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGenealogies, type Person } from '../../study/refData';
import { buildFamilyQuiz } from '../../lib/familyQuiz';

/** Who was the father or mother of this person? Every question comes from the genealogies of Scripture in the app, and the answer shows where Scripture says it. */
export default function FamilyTiesPage() {
  const [persons, setPersons] = useState<Person[] | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  useEffect(() => { getGenealogies().then((g) => setPersons(g?.persons ?? [])).catch(() => setPersons([])); }, []);
  const qs = useMemo(() => (persons ? buildFamilyQuiz(persons, seed) : []), [persons, seed]);
  const q = qs[i];
  const done = !!persons && qs.length > 0 && i >= qs.length;
  const choose = (n: number) => { if (picked != null || !q) return; setPicked(n); if (n === q.answer) setScore((s) => s + 1); };
  const next = () => { setPicked(null); setI((x) => x + 1); };
  const again = () => { setSeed(Math.floor(Math.random() * 1e6)); setI(0); setPicked(null); setScore(0); };
  return (
    <div className="page">
      <h1>Family ties</h1>
      <p className="lede">Who was the father or mother? Questions come from the genealogies of Scripture in this app, and each answer shows where Scripture says it.</p>
      {!persons && <p className="muted" role="status">Loading…</p>}
      {persons && qs.length === 0 && <p className="muted">The genealogies are not on this device yet. <Link to="/downloads">Save them for offline use</Link>.</p>}
      {q && !done && (
        <section className="card" aria-label="Question">
          <p className="muted small">Question {i + 1} of {qs.length}</p>
          <h2 className="card-title">{q.text}</h2>
          <div className="ws-options" role="group" aria-label="Choices">
            {q.options.map((o, n) => <button key={o} className={`btn ws-opt${picked != null && n === q.answer ? ' right' : picked === n ? ' wrong' : ''}`} disabled={picked != null} onClick={() => choose(n)}>{o}</button>)}
          </div>
          {picked != null && <p role="status">{picked === q.answer ? 'Yes.' : `Not quite: ${q.options[q.answer]}.`} {q.ref && <span className="muted small">See {q.ref}.</span>} <button className="btn primary" onClick={next}>{i + 1 < qs.length ? 'Next' : 'See result'}</button></p>}
        </section>
      )}
      {done && <section className="card"><p className="ws-score">{score} of {qs.length}</p><p><button className="btn primary" onClick={again}>Another round</button> <Link className="btn" to="/study/people">Open the family trees</Link></p></section>}
    </div>
  );
}
