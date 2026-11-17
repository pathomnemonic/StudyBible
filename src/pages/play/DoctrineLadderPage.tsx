import GameHelp from '../../components/GameHelp';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ladderShare } from '../../lib/shareText';
import ShareButton from '../../components/ShareButton';
import { LADDER, type LadderLevel } from '../../data/doctrineLadder';
import { isPractice, recordPlay } from '../../lib/dailyGame';

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
  const [marks, setMarks] = useState<boolean[]>([]);
  const unlocked = (idx: number) => idx === 0 || (best[LADDER[idx - 1].id] ?? 0) >= PASS;
  const start = (l: LadderLevel) => { setLevel(l); setRound((r) => r + 1); setI(0); setPicked(null); setScore(0); setMarks([]); };
  const q = deck[i];
  const finished = !!level && i >= deck.length && deck.length > 0;
  const finish = () => {
    if (!level) return;
    const next = { ...best, [level.id]: Math.max(best[level.id] ?? 0, score) };
    if (!isPractice()) setBest(next); try { if (!isPractice()) localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    recordPlay('doctrineladder', { perfect: score === N });
  };
  const choose = (o: string) => { if (picked || !q) return; setPicked(o); setMarks((m) => [...m, o === q.a[0]]); if (o === q.a[0]) setScore((s) => s + 1); };
  const advance = () => { if (i + 1 >= deck.length) { setI(i + 1); finish(); } else { setI(i + 1); setPicked(null); } };

  if (!level) {
    return (
      <div className="page">
        <h1>Who Wants to Be a Saint?</h1>
        <GameHelp how={["Three levels of questions on what the Church teaches.", "Score enough right at one level to climb to the next."]} />
        <p className="lede">Climb toward sainthood: three levels of questions on what the Church teaches. Score {PASS} of {N} to climb to the next.</p>
        <ol className="dl-ladder" aria-label="Levels"><li className="dl-summit" style={{ order: -99 }} aria-hidden="true"><img src={`${import.meta.env.BASE_URL}arcade/3d/glowing-star.webp`} alt="" width="44" height="44" /><b>Sainthood</b></li>{LADDER.map((l, idx) => { const open = unlocked(idx), got = best[l.id] ?? 0; return (
          <li key={l.id} className={`dl-rung${open ? '' : ' locked'}${got >= PASS ? ' done' : ''}`} style={{ order: -idx }}><button className="dl-step" disabled={!open} onClick={() => start(l)}><img className="dl-ico" src={`${import.meta.env.BASE_URL}arcade/3d/${open ? ['seedling', 'books', 'crown'][idx] ?? 'star' : 'locked'}.webp`} alt="" width="52" height="52" /><span className="dl-txt"><strong>{l.title}</strong><em>{open ? l.blurb : `Score ${PASS} on the level before to unlock.`}</em><span className="dl-stars" aria-label={`Best ${got} of ${N}`}>{Array.from({ length: 5 }, (_, s) => <i key={s} className={got >= PASS + Math.round((s * (N - PASS)) / 4) && got >= PASS ? 'on' : ''}>★</i>)}<small>{got ? `best ${got}/${N}` : ''}</small></span></span></button></li>
        ); })}</ol>
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
            <ShareButton text={ladderShare({ level: level.title, marks })} path="/play/doctrineladder" label="Share result" className="btn" />
            <button className="btn ghost" onClick={() => start(level)}>Try again</button>
            <button className="btn ghost" onClick={() => setLevel(null)}>Levels</button>
          </div>
        </div>
      )}
    </div>
  );
}
