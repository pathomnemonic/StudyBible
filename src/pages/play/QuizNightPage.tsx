import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShareButton from '../../components/ShareButton';
import { CATEGORIES, buildQuiz, type Category, type QuizItem } from '../../lib/quizBank';
import { getGrades, gradeLabel, type GradeMeta } from '../../curriculum/model';
import { recordPlay } from '../../lib/dailyGame';

type Mode = 'pass' | 'host';
const COUNTS = [10, 15, 20];

/** A quiz night for a family or a room. Pass the phone and each player answers in turn, or host: show a question, let people shout, reveal the answer, and keep score for each team. */
export default function QuizNightPage() {
  const [stage, setStage] = useState<'setup' | 'play' | 'done'>('setup');
  const [mode, setMode] = useState<Mode>('pass');
  const [names, setNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [cats, setCats] = useState<Category[]>(['doctrine', 'people', 'numbers']);
  const [count, setCount] = useState(10);
  const [grade, setGrade] = useState('5');
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const [qs, setQs] = useState<QuizItem[]>([]);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getGrades().then(setGrades); }, []);
  const switchMode = (m: Mode) => { setMode(m); setNames((x) => x.map((n) => n.replace(m === 'host' ? /^Player (\d)$/ : /^Team (\d)$/, m === 'host' ? 'Team $1' : 'Player $1'))); };
  const toggle = (c: Category) => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]));
  const start = async () => {
    setBusy(true);
    const list = await buildQuiz(cats, count, grade);
    setBusy(false);
    if (!list.length) return;
    setQs(list); setI(0); setScores(names.map(() => 0)); setPicked(null); setShown(false); setStage('play');
  };
  const q = qs[i];
  const turn = i % names.length;
  const answer = (k: number) => { if (picked !== null || !q) return; setPicked(k); if (k === q.answer) setScores((s) => s.map((x, n) => (n === turn ? x + 1 : x))); };
  const next = () => { if (i + 1 >= qs.length) { setStage('done'); recordPlay('familyquiz', { perfect: false }); } else { setI(i + 1); setPicked(null); setShown(false); } };
  const bump = (n: number, d: number) => setScores((s) => s.map((x, k) => (k === n ? Math.max(0, x + d) : x)));
  const ranking = names.map((n, k) => ({ n, s: scores[k] ?? 0 })).sort((a, b) => b.s - a.s);

  if (stage === 'setup') {
    return (
      <div className="page quiznight">
        <h1>Quiz night</h1>
        <p className="lede">For a family or a room. No accounts, nothing sent anywhere.</p>
        <div className="chips" role="group" aria-label="How to play">
          <button className={`chip${mode === 'pass' ? ' sel' : ''}`} aria-pressed={mode === 'pass'} onClick={() => switchMode('pass')}>Pass the phone</button>
          <button className={`chip${mode === 'host' ? ' sel' : ''}`} aria-pressed={mode === 'host'} onClick={() => switchMode('host')}>I’m the host</button>
        </div>
        <p className="muted small">{mode === 'pass' ? 'Each player takes a turn: pass the phone, tap an answer.' : 'You read the question aloud, people call out answers, you reveal the right one and give points to a team.'}</p>
        <fieldset className="cq"><legend>{mode === 'pass' ? 'Players' : 'Teams'} (2 to 6)</legend>
          {names.map((n, k) => <div key={k} className="row" style={{ gap: 6, marginBottom: 6 }}><input value={n} aria-label={`Name ${k + 1}`} onChange={(e) => setNames((x) => x.map((y, j) => (j === k ? e.target.value : y)))} style={{ flex: 1 }} />{names.length > 2 && <button className="btn small ghost" aria-label={`Remove ${n}`} onClick={() => setNames((x) => x.filter((_, j) => j !== k))}>×</button>}</div>)}
          {names.length < 6 && <button className="btn small" onClick={() => setNames((x) => [...x, `${mode === 'pass' ? 'Player' : 'Team'} ${x.length + 1}`])}>Add one</button>}
        </fieldset>
        <fieldset className="cq"><legend>Subjects</legend>
          <div className="chips">{CATEGORIES.map((c) => <button key={c.id} className={`chip${cats.includes(c.id) ? ' sel' : ''}`} aria-pressed={cats.includes(c.id)} title={c.blurb} onClick={() => toggle(c.id)}>{c.title}</button>)}</div>
          {cats.includes('lessons') && <label className="field"><span>Class level for catechism questions</span><select value={grade} onChange={(e) => setGrade(e.target.value)}>{grades.map((g) => <option key={g.id} value={g.id}>{gradeLabel(g.id)}</option>)}</select></label>}
        </fieldset>
        <fieldset className="cq"><legend>Questions</legend><div className="chips">{COUNTS.map((n) => <button key={n} className={`chip${count === n ? ' sel' : ''}`} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>)}</div></fieldset>
        <button className="btn primary big" disabled={!cats.length || busy} onClick={() => void start()}>{busy ? 'Getting ready…' : 'Start the quiz'}</button>
        <p className="small"><Link to="/play">All games</Link></p>
      </div>
    );
  }
  if (stage === 'done') {
    const top = ranking[0].s;
    return (
      <div className="page quiznight">
        <h1>{ranking.filter((r) => r.s === top).length > 1 ? 'A tie!' : `${ranking[0].n} wins!`}</h1>
        <ol className="list">{ranking.map((r) => <li key={r.n} className="row between"><strong>{r.n}</strong><span>{r.s} of {mode === 'pass' ? Math.ceil(qs.length / names.length) : qs.length}</span></li>)}</ol>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <ShareButton text={`Quiz night 🎉 ${ranking.map((r) => `${r.n} ${r.s}`).join(' · ')}`} path="/play/quiznight" label="Share the scores" />
          <button className="btn" onClick={() => void start()}>Play again</button><button className="btn ghost" onClick={() => setStage('setup')}>Change settings</button>
        </div>
      </div>
    );
  }
  return (
    <div className="page quiznight">
      <div className="row between"><span className="muted small">Question {i + 1} of {qs.length}</span><button className="btn small ghost" onClick={() => setStage('done')}>Finish</button></div>
      {mode === 'pass' && <p className="qn-turn">{names[turn]}’s turn</p>}
      <p className="qn-q">{q.q}</p>
      <div className="ws-options" role="group" aria-label="Answers">
        {q.opts.map((o, k) => {
          const reveal = mode === 'pass' ? picked !== null : shown;
          return <button key={k} className={`btn ws-opt${reveal ? (k === q.answer ? ' right' : k === picked ? ' wrong' : '') : ''}`} disabled={mode === 'pass' ? picked !== null : false} onClick={() => (mode === 'pass' ? answer(k) : undefined)}><b>{'ABCD'[k]}.</b> {o}</button>;
        })}
      </div>
      {mode === 'host' && !shown && <button className="btn primary" onClick={() => setShown(true)}>Reveal the answer</button>}
      {mode === 'host' && shown && (
        <div className="qn-host">
          <p><strong>{'ABCD'[q.answer]}. {q.opts[q.answer]}</strong>{q.note ? <span className="muted"> · {q.note}</span> : null}</p>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{names.map((n, k) => <span key={k} className="qn-team"><button className="btn small" onClick={() => bump(k, 1)}>+1 {n}</button><b>{scores[k]}</b></span>)}</div>
        </div>
      )}
      {mode === 'pass' && picked !== null && <div className="ws-after"><p>{picked === q.answer ? 'Correct!' : `The answer: ${q.opts[q.answer]}.`}{q.note ? <span className="muted small"> {q.note}</span> : null}</p></div>}
      {(mode === 'host' ? shown : picked !== null) && <button className="btn primary" onClick={next}>{i + 1 >= qs.length ? 'See the scores' : 'Next question'}</button>}
      <p className="muted small">{ranking.map((r) => `${r.n} ${r.s}`).join(' · ')}</p>
    </div>
  );
}
