import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY } from '../../data/glossary';
import { buildRound } from '../../lib/termMatch';
import { seeded, shuffled } from '../../lib/dailyGame';

/** Tap a meaning, then the term it belongs to. Right pairs lock in; a wrong tap costs a point. The wording is the glossary's own. */
export default function TermMatchPage() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const round = useMemo(() => buildRound(GLOSSARY, seed), [seed]);
  const terms = useMemo(() => shuffled(round.pairs.map((p) => p.term), seeded(seed + 1)), [round, seed]);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [bad, setBad] = useState('');
  const finished = done.length === round.pairs.length;
  const pickTerm = (t: string) => {
    if (sel == null || done.includes(t)) return;
    if (round.pairs.find((p) => p.meaning === sel)?.term === t) { setDone([...done, t]); setSel(null); setBad(''); }
    else { setMisses((m) => m + 1); setBad(t); }
  };
  const again = () => { setSeed(Math.floor(Math.random() * 1e6)); setSel(null); setDone([]); setMisses(0); setBad(''); };
  return (
    <div className="page">
      <h1>Match the term</h1>
      <p className="lede">Tap a meaning, then the word it belongs to. The meanings are the glossary’s own wording, with the word blanked out.</p>
      <div className="mt-grid" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <ul className="list" aria-label="Meanings">
          {round.pairs.map((p) => {
            const ok = done.includes(p.term);
            return <li key={p.term}><button className={`btn${sel === p.meaning ? ' primary' : ''}`} style={{ textAlign: 'left', width: '100%' }} aria-pressed={sel === p.meaning} disabled={ok} onClick={() => { setSel(p.meaning); setBad(''); }}>{p.meaning}{ok ? ` → ${p.term}` : ''}</button></li>;
          })}
        </ul>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignContent: 'flex-start' }} role="group" aria-label="Terms">
          {terms.map((t) => <button key={t} className={`btn${bad === t ? ' wrong' : ''}`} disabled={done.includes(t) || sel == null} onClick={() => pickTerm(t)}>{t}</button>)}
        </div>
      </div>
      <p className="muted small" role="status">{finished ? `Done with ${misses} ${misses === 1 ? 'miss' : 'misses'}.` : sel ? 'Now choose the word.' : 'Choose a meaning first.'}</p>
      {finished && <p className="row" style={{ gap: 8 }}><button className="btn primary" onClick={again}>Another round</button><Link className="btn" to="/study/glossary">Open the glossary</Link></p>}
    </div>
  );
}
