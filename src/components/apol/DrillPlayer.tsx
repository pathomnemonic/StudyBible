import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { findChain, chainRoute, readDrills, saveDrill, type Rating } from '../../lib/apolTracks';
import type { Chain, Step } from '../../chains/types';

const KIND: Record<Step['kind'], string> = { scripture: 'Scripture', father: 'Father', council: 'Council', catechism: 'Catechism', magisterium: 'Church teaching', saint: 'Saint', liturgy: 'Liturgy', writer: 'Writer' };
const RATES: { r: Rating; label: string }[] = [{ r: 'got', label: 'Got it' }, { r: 'partly', label: 'Partly' }, { r: 'not', label: 'Not yet' }];

/** "How would you answer?" cards built from a chain's sourced objections. The learner thinks or types a reply, then sees the sourced answer. */
export default function DrillPlayer({ trackId, sid, source, onFinished }: { trackId: string; sid: string; source: { type: 'chain' | 'claim'; id: string }; onFinished: () => void }) {
  const [chain, setChain] = useState<Chain | null | undefined>(undefined);
  const [i, setI] = useState(0);
  const [reply, setReply] = useState('');
  const [shown, setShown] = useState(false);
  const [rated, setRated] = useState<Record<string, Rating>>(() => readDrills()[`${trackId}:${sid}`] ?? {});
  useEffect(() => { let live = true; findChain(source.type, source.id).then((f) => live && setChain(f?.chain ?? null)); return () => { live = false; }; }, [source.type, source.id]);
  if (chain === undefined) return <p className="muted small">Loading the practice cards…</p>;
  const obs = chain?.objections ?? [];
  if (!chain || !obs.length) return <p className="muted small">This practice is not available yet.</p>;
  const total = obs.length;
  const finished = i >= total;
  const route = chainRoute(source.type, source.id);
  const rate = (r: Rating) => {
    saveDrill(trackId, sid, i, r);
    setRated({ ...rated, [String(i)]: r });
    setReply(''); setShown(false);
    if (i + 1 >= total) { setI(total); onFinished(); } else setI(i + 1);
  };
  if (finished) {
    const got = Object.values(rated).filter((x) => x === 'got').length;
    return (
      <div className="apt-drill" role="status">
        <p><strong>Practice finished.</strong> You were confident on {got} of {total}.</p>
        {Object.values(rated).some((x) => x !== 'got') && <p className="muted small">The ones marked partly or not yet are worth another try. The whole chain shows each source in order.</p>}
        <div className="apt-actions">
          <button type="button" className="btn small" onClick={() => { setI(0); setRated({}); }}>Practise again</button>
          {route && <Link className="btn small ghost" to={route}>Open the full chain</Link>}
        </div>
      </div>
    );
  }
  const o = obs[i];
  return (
    <div className="apt-drill">
      <p className="muted small" aria-live="polite">Question {i + 1} of {total}. “{chain.title}”</p>
      <blockquote className="apt-obj"><strong>Someone says:</strong> {o.q}</blockquote>
      {!shown ? (
        <>
          <label className="small" htmlFor={`d-${sid}`}>How would you reply? Type it, or just think it through. Nothing leaves this device.</label>
          <textarea id={`d-${sid}`} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} className="apt-ta" />
          <button type="button" className="btn primary small" onClick={() => setShown(true)}>Show the sourced answer</button>
        </>
      ) : (
        <>
          {reply.trim() && <p className="small"><strong>Your reply:</strong> {reply}</p>}
          <div className="apt-answer"><p style={{ marginTop: 0 }}>{o.a}</p>
            {o.steps && o.steps.length > 0 && (
              <ol className="apt-quotes">{o.steps.map((s, k) => (
                <li key={k}><span className="chip">{KIND[s.kind]}</span> <strong>{s.label}</strong>{s.when ? <span className="muted small"> ({s.when})</span> : null}
                  {s.quote && <blockquote>{s.quote}</blockquote>}
                  <span className="muted small">{s.note}</span></li>
              ))}</ol>
            )}
          </div>
          <div className="apt-rate" role="group" aria-label="How did you do?">
            <span className="small">How did you do?</span>
            {RATES.map((x) => <button key={x.r} type="button" className="btn small" onClick={() => rate(x.r)}>{x.label}</button>)}
          </div>
        </>
      )}
    </div>
  );
}
