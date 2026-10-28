import { useEffect, useMemo, useState } from 'react';
import { getGrade, getGrades, gradeLabel, flatLessons, parseQuiz, type GradeMeta, type Question } from '../curriculum/model';
import { dayIndex, seeded, shuffled } from '../lib/dailyGame';
import PrintButton from '../components/PrintButton';

type Kind = 'think' | 'recall' | 'check' | 'myth';
interface Card { kind: Kind; lesson: string; unit: string; text: string; options?: string[]; answer?: string; why?: string }
const KIND: Record<Kind, string> = { think: 'Think about it', recall: 'Say it by heart', check: 'Quick check', myth: 'Myth or truth?' };

/** The cards a lesson can make: its opening question, its verse to learn, a quiz question, and a common misunderstanding. */
export function cardsFor(l: { title: string; question?: string; mem?: string; quiz?: string[]; misc?: string[] }, unit: string): Card[] {
  const out: Card[] = [];
  if (l.question) out.push({ kind: 'think', lesson: l.title, unit, text: l.question });
  if (l.mem) out.push({ kind: 'recall', lesson: l.title, unit, text: `Who can say this by heart?  ${l.mem}` });
  for (const raw of (l.quiz ?? []).slice(0, 1)) { const q: Question = parseQuiz(raw); if (q.options.length === 4 && q.options[q.answer]) out.push({ kind: 'check', lesson: l.title, unit, text: q.q, options: q.options, answer: q.options[q.answer], why: q.why }); }
  for (const m of (l.misc ?? []).slice(0, 1)) out.push({ kind: 'myth', lesson: l.title, unit, text: `${m} Is that true? Why or why not?` });
  return out;
}

/** A short warm-up for the first minutes of class: one card a day from the grade’s own lessons, or five for the week to print. */
export default function BellRingersPage() {
  const [grades, setGrades] = useState<GradeMeta[]>([]);
  const [grade, setGrade] = useState(() => { try { return localStorage.getItem('sb:bell:grade') ?? '5'; } catch { return '5'; } });
  const [cards, setCards] = useState<Card[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [reveal, setReveal] = useState(false);
  useEffect(() => { void getGrades().then(setGrades); }, []);
  useEffect(() => {
    let live = true; setCards(null);
    getGrade(grade).then((g) => { if (!g || !live) return; setCards(flatLessons(g).flatMap((l) => cardsFor(l, l.unit.title))); });
    try { localStorage.setItem('sb:bell:grade', grade); } catch { /* private mode */ }
    return () => { live = false; };
  }, [grade]);
  const order = useMemo(() => (cards ? shuffled(cards, seeded(Number(grade.replace(/\D/g, '') || 99) + 5)) : []), [cards, grade]);
  const at = (i: number) => order[(dayIndex() + offset + i) % Math.max(1, order.length)];
  const today = at(0);
  const week = Array.from({ length: 5 }, (_, i) => at(i)).filter(Boolean);
  return (
    <div className="page bell">
      <div className="row between no-print"><h1>Bell ringers</h1><PrintButton label="Print the week" className="btn small primary" /></div>
      <label className="field no-print"><span>Grade</span>
        <select value={grade} onChange={(e) => { setGrade(e.target.value); setOffset(0); setReveal(false); }}>{grades.map((g) => <option key={g.id} value={g.id}>{gradeLabel(g.id)}</option>)}</select>
      </label>
      {!cards && <p className="muted">Loading…</p>}
      {today && (
        <section className="card bell-card no-print">
          <p className="eyebrow">{KIND[today.kind]}</p>
          <p className="bell-text">{today.text}</p>
          {today.options && <ol type="A" className="bell-opts">{today.options.map((o) => <li key={o}>{o}</li>)}</ol>}
          {today.answer && <p>{reveal ? <><strong>Answer:</strong> {today.answer}{today.why ? ` (${today.why})` : ''}</> : <button className="btn small" onClick={() => setReveal(true)}>Show the answer</button>}</p>}
          <p className="muted small">From “{today.lesson}” · {today.unit}</p>
          <div className="row" style={{ gap: 8 }}><button className="btn small" onClick={() => { setOffset((o) => o + 1); setReveal(false); }}>Another card</button></div>
        </section>
      )}
      {week.length > 0 && (
        <div className="print-sheet bell-sheet">
          <h2 style={{ margin: '0 0 6px' }}>Bell ringers: {gradeLabel(grade)}</h2>
          <ol className="bell-week">{week.map((c, i) => <li key={i}><strong>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i]}.</strong> <em>{KIND[c.kind]}.</em> {c.text}{c.options && <span className="bell-inline"> {c.options.map((o, k) => `${'ABCD'[k]}) ${o}`).join('   ')}</span>}</li>)}</ol>
          <p className="muted small">Answers: {week.map((c, i) => c.answer ? `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}: ${c.answer}` : '').filter(Boolean).join(' · ') || 'none this week'}</p>
        </div>
      )}
    </div>
  );
}
