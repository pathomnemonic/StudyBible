import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadDaily } from '../../study/daily';
import { dayIndex, markDailyDone, seeded, shuffled } from '../../lib/dailyGame';

const ROUNDS = 5;
interface Q { text: string; who: string; work?: string; options: string[] }

/** Five quotations from the saints and Fathers: who said it? The same five for everyone each day. */
export default function WhoSaidPage() {
  const [pool, setPool] = useState<{ text: string; who: string; work?: string }[] | null>(null);
  const [daily, setDaily] = useState(true);
  const [seed, setSeed] = useState(dayIndex());
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  useEffect(() => {
    loadDaily().then((d) => {
      const seen = new Set<string>();
      const all = Object.values(d?.generic ?? {}).map((e) => e.saint).filter((s) => s && s.verified !== false && !s.misattributed && s.text && s.who && !s.who.includes('(') && s.text.length <= 240);
      setPool(all.filter((s) => (seen.has(s.text) ? false : (seen.add(s.text), true))));
    });
  }, []);
  const qs = useMemo<Q[]>(() => {
    if (!pool) return [];
    const r = seeded(seed + 17);
    const names = [...new Set(pool.map((p) => p.who))];
    return shuffled(pool, r).slice(0, ROUNDS).map((p) => ({ ...p, options: shuffled([p.who, ...shuffled(names.filter((n) => n !== p.who), r).slice(0, 3)], r) }));
  }, [pool, seed]);
  const done = i >= ROUNDS;
  useEffect(() => { if (done) markDailyDone('whosaid', `${score}/${ROUNDS}`); }, [done]); // eslint-disable-line
  const q = qs[i];
  const choose = (o: string) => { if (picked || !q) return; setPicked(o); const ok = o === q.who; if (ok) setScore((s) => s + 1); setMarks((m) => [...m, ok]); };
  const next = () => { setPicked(null); setI((n) => n + 1); };
  const again = () => { setDaily(false); setSeed(Math.floor(Math.random() * 1e6)); setI(0); setScore(0); setMarks([]); setPicked(null); };
  const share = () => { const text = `Who Said It? ${daily ? dayIndex() : 'practice'} ${score}/${ROUNDS}\n${marks.map((m) => (m ? '🟨' : '⬛')).join('')}`; if (navigator.share) navigator.share({ text }).catch(() => undefined); else navigator.clipboard?.writeText(text).catch(() => undefined); };

  if (!pool) return <div className="page"><h1>Who Said It?</h1><p className="muted">Loading…</p></div>;
  return (
    <div className="page whosaid">
      <h1>Who Said It?</h1>
      {!done && q ? (
        <>
          <p className="muted small">Quote {i + 1} of {ROUNDS}</p>
          <blockquote className="ws-quote">“{q.text}”</blockquote>
          <div className="ws-options" role="group" aria-label="Who said it?">
            {q.options.map((o) => (
              <button key={o} className={`btn ws-opt${picked ? (o === q.who ? ' right' : o === picked ? ' wrong' : '') : ''}`} onClick={() => choose(o)} aria-disabled={!!picked}>{o}</button>
            ))}
          </div>
          {picked && (
            <div className="ws-after">
              <p>{picked === q.who ? 'Yes.' : 'Not quite.'} <strong>{q.who}</strong>{q.work ? `, ${q.work}` : ''}.</p>
              <button className="btn primary" onClick={next}>{i + 1 === ROUNDS ? 'See my score' : 'Next quote'}</button>
            </div>
          )}
        </>
      ) : (
        <div className="ws-end">
          <p className="ws-score">{score} of {ROUNDS}</p>
          <p className="muted">{score === ROUNDS ? 'A true student of the saints.' : score >= 3 ? 'Well read.' : 'Keep reading: they are good company.'}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}><button className="btn" onClick={share}>Share result</button><button className="btn ghost" onClick={again}>Play another five</button></div>
          <p className="small"><Link to="/study/saints">Read more from the saints</Link></p>
        </div>
      )}
    </div>
  );
}
