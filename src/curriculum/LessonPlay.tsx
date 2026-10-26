import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/db';
import { questionsFor, pick, type BankQuestion } from '../live/bank';
import { isCorrect } from '../live/judge';
import type { GradeData, Glossary, LessonSpec } from './model';
import { progressId } from './model';

const SHAPES = ['▲', '◆', '●', '■'];
type Tab = 'myth' | 'quiz' | 'cards' | 'match' | 'word';

/** Stars earned in the lesson challenge, kept in the synced progress table as lessonIndex*10 + stars. */
export const xpId = (grade: string) => `curxp:${grade}`;
export async function saveStars(grade: string, index: number, stars: number) {
  const id = xpId(grade);
  const cur = await db.planProgress.get(id);
  const have = new Map((cur?.done ?? []).map((n) => [Math.floor(n / 10), n % 10]));
  if ((have.get(index) ?? 0) >= stars) return;
  have.set(index, stars);
  await db.planProgress.put({ ...(cur ?? { planId: id, startedAt: Date.now(), status: 'active' as const, offsetDays: 0 }), planId: id, done: [...have].map(([i, s]) => i * 10 + s) });
}
export const starsOf = (done: number[] | undefined) => new Map((done ?? []).map((n) => [Math.floor(n / 10), n % 10]));
void progressId;

/** Three ways to play with a lesson before or after reading it: Myth or truth, a scored challenge, and word cards. */
export default function LessonPlay({ grade, lesson, index, gl }: { grade: GradeData; lesson: LessonSpec & { unit: GradeData['units'][number] }; index: number; gl: Glossary }) {
  const [tab, setTab] = useState<Tab>('myth');
  const [all, setAll] = useState<BankQuestion[]>([]);
  useEffect(() => { questionsFor(grade, [lesson]).then(setAll); }, [grade.id, lesson.id]);
  return (
    <section className="sect lesson-play no-print" aria-label="Play">
      <h2 className="eyebrow-h">Play it!</h2>
      <div className="tabbar" role="tablist">
        {([['myth', '🎭 Myth or truth'], ['quiz', '⚡ Challenge'], ['cards', '🃏 Word cards'], ['match', '🧩 Match up'], ['word', '🕯 Mystery word']] as [Tab, string][]).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'myth' && <Myth key={lesson.id} all={all} />}
      {tab === 'quiz' && <Challenge key={lesson.id} all={all} grade={grade} index={index} />}
      {tab === 'cards' && <Cards lesson={lesson} gl={gl} />}
      {tab === 'match' && <MatchUp key={lesson.id} lesson={lesson} gl={gl} grade={grade} />}
      {tab === 'word' && <MysteryWord key={lesson.id} lesson={lesson} gl={gl} grade={grade} />}
    </section>
  );
}

function Myth({ all }: { all: BankQuestion[] }) {
  const cards = useMemo(() => {
    const tf = all.filter((q) => q.type === 'tf');
    const mine = [...tf.filter((q) => q.correct[0] === 0), ...tf.filter((q) => q.correct[0] === 1)];
    return mine.map((q) => ({ text: q.q.replace(/^True or false:\s*/, ''), truth: q.correct[0] === 0, why: q.why ?? '' })).sort(() => Math.random() - 0.5).slice(0, 6);
  }, [all.length]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  if (!cards.length) return <p className="muted">Loading…</p>;
  if (i >= cards.length) return <div className="play-card"><h3>{score} of {cards.length} spotted! {score === cards.length ? '🌟' : ''}</h3><button className="btn" onClick={() => { setI(0); setScore(0); setPick(null); }}>Play again</button></div>;
  const c = cards[i];
  const answer = (v: boolean) => { setPick(v); if (v === c.truth) setScore((s) => s + 1); };
  return (
    <div className="play-card">
      <p className="muted small">Card {i + 1} of {cards.length} · Is this a myth or the truth?</p>
      <p className="play-text">“{c.text}”</p>
      {pick === null ? (
        <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
          <button className="btn big play-myth" onClick={() => answer(false)}>🎭 Myth</button>
          <button className="btn big play-truth" onClick={() => answer(true)}>✝ Truth</button>
        </div>
      ) : (
        <div>
          <h3 className={pick === c.truth ? 'live-right' : 'live-wrong'}>{pick === c.truth ? '✓ Yes!' : '✗ Not quite.'} It is {c.truth ? 'the truth' : 'a myth'}.</h3>
          {!c.truth && c.why && <p className="muted">{c.why.replace(/^False\.\s*/, 'The Church teaches: ')}</p>}
          <button className="btn primary" onClick={() => { setI(i + 1); setPick(null); }}>Next →</button>
        </div>
      )}
    </div>
  );
}

function Challenge({ all, grade, index }: { all: BankQuestion[]; grade: GradeData; index: number }) {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => pick(all.filter((q) => q.type !== 'order'), 8, grade.band === 'primary' || grade.band === 'elementary' ? 'mixed' : 'hard', round * 7919 + 13), [all.length, round]);
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [res, setRes] = useState<null | boolean>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const q = qs[i];
  useEffect(() => { if (qs.length && i >= qs.length) { const stars = right >= qs.length * 0.9 ? 3 : right >= qs.length * 0.6 ? 2 : 1; void saveStars(grade.id, index, stars); } }, [i]);
  if (!qs.length) return <p className="muted">Loading…</p>;
  if (i >= qs.length) {
    const stars = right >= qs.length * 0.9 ? 3 : right >= qs.length * 0.6 ? 2 : 1;
    return <div className="play-card"><div className="play-stars" aria-label={`${stars} stars`}>{[1, 2, 3].map((n) => <span key={n} className={n <= stars ? 'on' : ''}>★</span>)}</div><h3>{right} of {qs.length} right · {xp} XP</h3><button className="btn" onClick={() => { setRound(round + 1); setI(0); setXp(0); setRight(0); setStreak(0); setRes(null); setSel([]); setText(''); }}>New challenge</button></div>;
  }
  const submit = (v: (number | string)[]) => { const ok = isCorrect(q, v); setRes(ok); if (ok) { setRight((r) => r + 1); setXp((x) => x + (q.points === 2 ? 20 : 10) + Math.min(streak, 5) * 2); setStreak((s) => s + 1); } else setStreak(0); };
  const next = () => { setI(i + 1); setRes(null); setSel([]); setText(''); };
  return (
    <div className="play-card">
      <div className="row between small muted"><span>Question {i + 1} of {qs.length}</span><span>⚡ {xp} XP{streak >= 2 ? ` · 🔥 ${streak}` : ''}</span></div>
      <p className="play-text">{q.q}</p>
      {res === null && (q.type === 'mc' || q.type === 'tf') && <div className="live-opts n4">{q.options!.map((o, k) => <button key={k} className={`live-opt o${k}`} onClick={() => submit([k])}><span className="shape" aria-hidden="true">{SHAPES[k]}</span>{o}</button>)}</div>}
      {res === null && q.type === 'multi' && <><p className="muted small">Choose all that apply.</p><div className="live-opts n4">{q.options!.map((o, k) => <button key={k} className={`live-opt o${k % 4}${sel.includes(k) ? ' on' : ''}`} aria-pressed={sel.includes(k)} onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}><span className="shape" aria-hidden="true">{sel.includes(k) ? '✓' : SHAPES[k % 4]}</span>{o}</button>)}</div><button className="btn primary" disabled={!sel.length} onClick={() => submit(sel)}>Check</button></>}
      {res === null && q.type === 'text' && <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit([text.trim()]); }} className="row" style={{ gap: 8 }}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the word" aria-label="Your answer" style={{ flex: 1 }} /><button className="btn primary">Check</button></form>}
      {res !== null && (
        <div>
          <h3 className={res ? 'live-right' : 'live-wrong'}>{res ? '✓ Correct!' : '✗ Not this time'}</h3>
          {!res && <p>Right answer: <strong>{q.type === 'text' ? q.correct.join(' or ') : q.correct.map((c) => q.options![Number(c)]).join(' · ')}</strong></p>}
          {q.why && <p className="muted">{q.why}</p>}
          <button className="btn primary" onClick={next}>{i + 1 >= qs.length ? 'See my stars' : 'Next →'}</button>
        </div>
      )}
    </div>
  );
}

function Cards({ lesson, gl }: { lesson: LessonSpec; gl: Glossary }) {
  const words = lesson.vocab.filter((v) => gl[v]);
  const [flip, setFlip] = useState<Record<string, boolean>>({});
  if (!words.length) return <p className="muted">This lesson has no new words.</p>;
  return (
    <div className="play-cards">
      {words.map((v) => <button key={v} className={`flip${flip[v] ? ' on' : ''}`} onClick={() => setFlip({ ...flip, [v]: !flip[v] })} aria-pressed={!!flip[v]}><span className="face front">{gl[v].w}<small>tap to flip</small></span><span className="face back">{gl[v].d}</span></button>)}
    </div>
  );
}

const short = (d: string) => (d.length > 70 ? d.slice(0, 68).replace(/\s+\S*$/, '') + '…' : d);

/** Find the pairs: a word and what it means. */
function MatchUp({ lesson, gl, grade }: { lesson: LessonSpec; gl: Glossary; grade: GradeData }) {
  const terms = useMemo(() => {
    const own = lesson.vocab.filter((v) => gl[v]);
    const more = grade.units.flatMap((u) => u.lessons.flatMap((l) => l.vocab)).filter((v) => gl[v] && !own.includes(v));
    return [...own, ...more.sort(() => Math.random() - 0.5)].slice(0, 5);
  }, [lesson.id]);
  const cards = useMemo(() => terms.flatMap((t) => [{ id: t, kind: 'w', text: gl[t].w }, { id: t, kind: 'd', text: short(gl[t].d) }]).sort(() => Math.random() - 0.5), [terms]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const tap = (i: number) => {
    if (open.length === 2 || open.includes(i) || done.includes(cards[i].id)) return;
    const n = [...open, i];
    setOpen(n);
    if (n.length === 2) {
      setTries((t) => t + 1);
      const [a, b] = n.map((k) => cards[k]);
      if (a.id === b.id && a.kind !== b.kind) setTimeout(() => { setDone((d) => [...d, a.id]); setOpen([]); }, 500);
      else setTimeout(() => setOpen([]), 900);
    }
  };
  if (terms.length < 3) return <p className="muted">This lesson has too few new words for a matching game.</p>;
  const won = done.length === terms.length;
  return (
    <div className="play-card">
      <p className="muted small">Turn over a word and then its meaning. Tries: {tries}</p>
      <div className="match-grid">{cards.map((c, i) => { const shown = open.includes(i) || done.includes(c.id); return <button key={i} className={`match-card${shown ? ' up' : ''}${done.includes(c.id) ? ' done' : ''} ${c.kind}`} onClick={() => tap(i)} aria-label={shown ? c.text : 'Hidden card'}>{shown ? c.text : '✝'}</button>; })}</div>
      {won && <div><h3>🌟 All matched in {tries} tries!</h3></div>}
    </div>
  );
}

/** A hidden word, a clue and six candles: each wrong letter snuffs one out. */
function MysteryWord({ lesson, gl, grade }: { lesson: LessonSpec; gl: Glossary; grade: GradeData }) {
  const pool = useMemo(() => { const own = lesson.vocab.filter((v) => gl[v] && /^[A-Za-z]{4,12}$/.test(gl[v].w)); return own.length ? own : grade.units.flatMap((u) => u.lessons.flatMap((l) => l.vocab)).filter((v) => gl[v] && /^[A-Za-z]{4,12}$/.test(gl[v].w)); }, [lesson.id]);
  const [round, setRound] = useState(0);
  const term = pool[(round + lesson.id.length) % Math.max(1, pool.length)];
  const [guess, setGuess] = useState<string[]>([]);
  if (!term) return <p className="muted">This lesson has no single words for this game.</p>;
  const word = gl[term].w.toUpperCase();
  const wrong = guess.filter((g) => !word.includes(g)).length;
  const won = [...word].every((c) => guess.includes(c));
  const lost = wrong >= 6;
  return (
    <div className="play-card">
      <p className="muted small">Clue: {gl[term].d}</p>
      <div className="candles" aria-label={`${6 - wrong} candles left`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < 6 - wrong ? 'lit' : ''}>{i < 6 - wrong ? '🕯' : '·'}</span>)}</div>
      <div className="mystery" aria-label={won || lost ? word : 'Hidden word'}>{[...word].map((c, i) => <span key={i}>{guess.includes(c) || lost ? c : ''}</span>)}</div>
      {won && <h3 className="live-right">✓ You found it!</h3>}
      {lost && <h3 className="live-wrong">The word was {word}.</h3>}
      {!won && !lost && <div className="keys">{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => <button key={c} disabled={guess.includes(c)} onClick={() => setGuess([...guess, c])}>{c}</button>)}</div>}
      {(won || lost) && <button className="btn" onClick={() => { setRound(round + 1); setGuess([]); }}>Another word</button>}
    </div>
  );
}
