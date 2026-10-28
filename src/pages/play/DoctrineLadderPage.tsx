import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShareButton from '../../components/ShareButton';
import { LADDER, type LadderLevel } from '../../data/doctrineLadder';
import { recordPlay } from '../../lib/dailyGame';

const KEY = 'sb:ladder:v1';
const PASS = 7, N = 10;
const load = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>; } catch { return {}; } };
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Three levels of questions on what the Church teaches, each with the Catechism paragraph behind the answer. Score 7 of 10 to climb. */
export default function DoctrineLadderPage() {
  const [best, setBest] = useState<Record<string, number>>(load);
  const [level, setLevel] = useState<LadderLevel | null>(null);
  const [round, setRound] = useState(0);
  const deck = useMemo(() => (level ? shuffle(level.questions).slice(0, N).map((q) => ({ ...q, opts: shuffle(q.a) })) : []), [level, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const unlocked = (idx: number) => idx === 0 || (best[LADDER[idx - 1].id] ?? 0) >= PASS;
  const start = (l: LadderLevel) => { setLevel(l); setRound((r) => r + 1); setI(0); setPicked(null); setScore(0); };
  const q = deck[i];
  const finished = !!level && i >= deck.length && deck.length > 0;
  const finish = () => {
    if (!level) return;
    const next = { ...best, [level.id]: Math.max(best[level.id] ?? 0, score) };
    setBest(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    recordPlay('doctrineladder', { perfect: score === N });
  };
  const choose = (o: string) => { if (picked || !q) return; setPicked(o); if (o === q.a[0]) setScore((s) => s + 1); };
  const advance = () => { if (i + 1 >= deck.length) { setI(i + 1); finish(); } else { setI(i + 1); setPicked(null); } };

  if (!level) {
    return (
      <div className="page">
        <h1>Doctrine ladder</h1>
        <p className="lede">Three levels of questions on what the Church teaches. Score {PASS} of {N} to climb to the next.</p>
        <ul className="play-list">{LADDER.map((l, idx) => (
          <li key={l.id}><button className="play-card" disabled={!unlocked(idx)} onClick={() => start(l)} style={{ width: '100%', textAlign: 'left' }}><span className="play-ico" aria-hidden="true">{unlocked(idx) ? ['🪜', '📘', '🎓'][idx] : '🔒'}</span><span><strong>{l.title}{best[l.id] ? ` ✓ best ${best[l.id]}/${N}` : ''}</strong><em>{unlocked(idx) ? l.blurb : `Score ${PASS} on the level before to unlock.`}</em></span></button></li>
        ))}</ul>
      </div>
    );
  }
  return (
    <div className="page whosaid">
      <h1>{level.title}</h1>
      {!finished && q ? (
        <>
          <p className="muted small">Question {i + 1} of {deck.length} · {score} right</p>
          <p className="ws-quote" style={{ fontStyle: 'normal' }}>{q.q}</p>
          <div className="ws-options" role="group" aria-label="Answers">{q.opts.map((o) => <button key={o} className={`btn ws-opt${picked ? (o === q.a[0] ? ' right' : o === picked ? ' wrong' : '') : ''}`} disabled={!!picked} onClick={() => choose(o)}>{o}</button>)}</div>
          {picked && <div className="ws-after"><p>{picked === q.a[0] ? 'Yes.' : `The answer: ${q.a[0]}.`} <Link to={`/study/catechism/${q.ccc}`}>Catechism §{q.ccc}</Link></p><button className="btn primary" onClick={advance}>{i + 1 >= deck.length ? 'See my score' : 'Next'}</button></div>}
        </>
      ) : (
        <div className="ws-end">
          <p className="ws-score">{score} of {deck.length}</p>
          <p className="muted">{score >= PASS ? (LADDER.indexOf(level) < LADDER.length - 1 ? 'Well done: the next level is open.' : 'You have reached the top of the ladder.') : `Score ${PASS} to climb. Try again.`}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <ShareButton text={`Doctrine ladder 🪜 ${level.title}: ${score}/${deck.length}`} path="/play/doctrineladder" label="Share result" className="btn" />
            <button className="btn ghost" onClick={() => start(level)}>Try again</button>
            <button className="btn ghost" onClick={() => setLevel(null)}>Levels</button>
          </div>
        </div>
      )}
    </div>
  );
}
