import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATS, levelOf, type TQ } from '../../lib/trivia';
import { loadTriviaBank } from '../../lib/triviaBank';
import { createHost } from '../../live/link';
import { DEFAULT_SETTINGS } from '../../live/bank';
import type { LiveQuestion, LiveSettings } from '../../live/types';

const TIMES = [{ s: 12, label: 'Quick' }, { s: 20, label: 'Normal' }, { s: 35, label: 'Relaxed' }];
const HARD = { easy: [0.8, 0.2, 0], mixed: [0.4, 0.4, 0.2], hard: [0.1, 0.4, 0.5] } as const;

/** An online quiz anyone can join with a six-digit code: no account, no sign-in. The host's device runs the room; friends type the code on their own phones. */
export default function OnlineQuizPage() {
  const nav = useNavigate();
  const [bank, setBank] = useState<Record<string, TQ[]> | null>(null);
  const [cats, setCats] = useState<string[]>(CATS.map((c) => c.id));
  const [count, setCount] = useState(12);
  const [level, setLevel] = useState<'easy' | 'mixed' | 'hard'>('mixed');
  const [time, setTime] = useState(20);
  const [teams, setTeams] = useState(0);
  const [elim, setElim] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => { void loadTriviaBank().then(setBank); }, []);
  void levelOf;
  const toggle = (id: string) => setCats((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const pool = bank ? cats.flatMap((c) => bank[c] ?? []) : [];

  const open = async () => {
    setBusy(true); setErr('');
    try {
      if (!pool.length) throw new Error('Choose at least one category.');
      const w = HARD[level];
      const byD = (d: number) => pool.filter((q) => q.d === d).sort(() => Math.random() - 0.5);
      const lists = [byD(1), byD(2), byD(3)];
      const want = [Math.round(count * w[0]), Math.round(count * w[1]), 0]; want[2] = Math.max(0, count - want[0] - want[1]);
      const picked: TQ[] = [];
      lists.forEach((l, i) => picked.push(...l.slice(0, want[i])));
      for (const q of pool.sort(() => Math.random() - 0.5)) { if (picked.length >= count) break; if (!picked.includes(q)) picked.push(q); }
      const questions: LiveQuestion[] = picked.slice(0, count).map((q) => ({ type: 'mc', q: q.q, options: q.o, correct: [q.a], time, points: q.d === 3 ? 2 : 1, why: q.why }));
      const settings: LiveSettings = { ...DEFAULT_SETTINGS, mode: 'game', teams, elimination: elim, rosterOnly: false, shuffleQuestions: true, shuffleOptions: true, lateJoin: true, showNames: true };
      const c = await createHost({ title: 'Cathology quiz night', slides: [], questions }, settings, []);
      nav(`/host/${c.code}`);
    } catch (e) { setErr((e as Error).message || 'Could not open a room. Check your connection and try again.'); setBusy(false); }
  };

  return (
    <div className="page">
      <p className="small"><Link to="/play">← Games</Link></p>
      <h1>Play online together</h1>
      <p className="lede">One person opens a room and shares a six-digit code. Everyone else joins from their own phone, tablet or computer: no account, no sign-in.</p>

      <section className="card" aria-label="Join a game">
        <h2 style={{ marginTop: 0 }}>Have a code?</h2>
        <form className="row" style={{ gap: 8, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); if (code.length === 6) nav(`/join/${code}`); }}>
          <label className="sr-only" htmlFor="oq-code">Game code</label>
          <input id="oq-code" inputMode="numeric" autoComplete="off" maxLength={6} pattern="\d{6}" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ width: 130, fontSize: '1.3rem', letterSpacing: 4, textAlign: 'center' }} />
          <button className="btn primary" disabled={code.length !== 6}>Join</button>
        </form>
      </section>

      <section className="card" aria-label="Host a game">
        <h2 style={{ marginTop: 0 }}>Host a game</h2>
        <p className="muted small">Your screen shows the questions and the scoreboard (a computer, tablet or TV works best); everyone answers on their own phone. Keep this app open while you play.</p>
        <fieldset style={{ border: 0, padding: 0, margin: '8px 0' }}>
          <legend className="muted small">Categories</legend>
          <div className="chips">{CATS.map((c) => <button key={c.id} type="button" className={`chip${cats.includes(c.id) ? ' sel' : ''}`} aria-pressed={cats.includes(c.id)} onClick={() => toggle(c.id)}>{c.icon} {c.name}</button>)}</div>
        </fieldset>
        <div className="live-form" style={{ maxWidth: 'none' }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <label>Questions<select value={count} onChange={(e) => setCount(+e.target.value)}>{[8, 12, 16, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label>Difficulty<select value={level} onChange={(e) => setLevel(e.target.value as 'easy')}><option value="easy">Easier</option><option value="mixed">Mixed</option><option value="hard">Harder</option></select></label>
            <label>Time to answer<select value={time} onChange={(e) => setTime(+e.target.value)}>{TIMES.map((t) => <option key={t.s} value={t.s}>{t.label} ({t.s}s)</option>)}</select></label>
            <label>Teams<select value={teams} onChange={(e) => setTeams(+e.target.value)}><option value={0}>Everyone for themselves</option>{[2, 3, 4].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>
          </div>
          <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={elim} onChange={(e) => setElim(e.target.checked)} /> Last one standing: a wrong answer puts you out</label>
        </div>
        {err && <div className="notice warn" role="alert">{err}</div>}
        <p><button className="btn primary big" onClick={() => void open()} disabled={busy || !bank || !pool.length}>{busy ? 'Opening the room…' : 'Open the room'}</button></p>
        <p className="muted small">{bank ? `${pool.length} questions in the chosen categories.` : 'Loading questions…'} Messages between devices are encrypted with a key made from the code, and go through a free public relay; nothing is stored.</p>
      </section>
    </div>
  );
}
