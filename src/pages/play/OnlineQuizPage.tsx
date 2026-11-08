import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATS, levelOf, type TQ } from '../../lib/trivia';
import { loadTriviaBank } from '../../lib/triviaBank';
import { createHost } from '../../live/link';
import { DEFAULT_SETTINGS } from '../../live/bank';
import type { LiveQuestion, LiveSettings } from '../../live/types';

const TIMES = [{ s: 12, label: 'Quick' }, { s: 20, label: 'Normal' }, { s: 35, label: 'Relaxed' }];
type Game = 'quiz' | 'crowns' | 'whoami';
const GAMES: { id: Game; label: string; blurb: string }[] = [
  { id: 'quiz', label: 'Quiz night', blurb: 'The host sets the pace: one question at a time, faster answers score more.' },
  { id: 'crowns', label: 'Crown Quest race', blurb: 'Everyone plays at their own pace. Spin for a category; three right answers earn its crown; first to every crown wins.' },
  { id: 'whoami', label: 'Who Am I?', blurb: 'A person from the Bible, with clues from hard to easy. The earlier you name them, the more you score.' },
];
/** rooms this device started and has not finished, so a sleeping or reloaded host can pick one up again */
function openRooms(): { code: string; title: string }[] {
  const out: { code: string; title: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (!k.startsWith('sb:live:snap:')) continue;
      try { const d = JSON.parse(localStorage.getItem(k) ?? ''); if (d.phase !== 'ended' && Date.now() - d.createdAt < 6 * 3600_000) out.push({ code: String(d.code), title: String(d.content?.title ?? 'Game') }); } catch { /* not a room */ }
    }
  } catch { /* storage unavailable */ }
  return out;
}
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
  const [game, setGame] = useState<Game>('quiz');
  const [minutes, setMinutes] = useState(10);
  const [people, setPeople] = useState(8);
  const [clueSec, setClueSec] = useState(12);
  const rooms = useMemo(openRooms, []);
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
      if (game !== 'whoami' && !pool.length) throw new Error('Choose at least one category.');
      if (game === 'crowns') {
        const per = Math.floor(120 / cats.length);
        const questions: LiveQuestion[] = cats.flatMap((id) => [...(bank![id] ?? [])].sort(() => Math.random() - 0.5).slice(0, per).map((q): LiveQuestion => ({ type: 'mc', q: q.q, options: q.o, correct: [q.a], time: 20, points: 1, why: q.why, cat: id })));
        const settings: LiveSettings = { ...DEFAULT_SETTINGS, mode: 'crowns', runMinutes: minutes, rosterOnly: false, shuffleQuestions: false, shuffleOptions: true, lateJoin: true, showNames: true };
        const c = await createHost({ title: 'Cathology Crown Quest race', slides: [], questions }, settings, []);
        nav(`/host/${c.code}`);
        return;
      }
      if (game === 'whoami') {
        const { WHO_AM_I } = await import('../../data/whoami');
        const questions: LiveQuestion[] = [...WHO_AM_I].sort(() => Math.random() - 0.5).slice(0, people).map((p) => ({ type: 'text', q: 'Who am I?', correct: [p.name, ...(p.also ?? [])], clues: [...p.clues], time: 60, points: 1 }));
        const settings: LiveSettings = { ...DEFAULT_SETTINGS, mode: 'whoami', clueSeconds: clueSec, rosterOnly: false, shuffleQuestions: false, shuffleOptions: false, lateJoin: true, showNames: true };
        const c = await createHost({ title: 'Cathology Who Am I?', slides: [], questions }, settings, []);
        nav(`/host/${c.code}`);
        return;
      }
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

      {rooms.length > 0 && <section className="card" aria-label="Rooms you opened"><h2 style={{ marginTop: 0 }}>Pick up where you left off</h2>{rooms.map((r) => <p key={r.code} className="lv-resume"><span>{r.title}, code <strong>{r.code}</strong></span><Link className="btn" to={`/host/${r.code}`}>Resume this room</Link></p>)}<p className="muted small">If your device went to sleep or the page was reloaded, the room comes back with every player’s name and score. Players rejoin by themselves.</p></section>}

      <section className="card" aria-label="Host a game">
        <h2 style={{ marginTop: 0 }}>Host a game</h2>
        <div className="chips" role="radiogroup" aria-label="Which game">{GAMES.map((g) => <button key={g.id} type="button" role="radio" aria-checked={game === g.id} className={`chip${game === g.id ? ' sel' : ''}`} onClick={() => setGame(g.id)}>{g.label}</button>)}</div>
        <p className="muted small">{GAMES.find((g) => g.id === game)!.blurb}</p>
        <p className="muted small">Your screen shows the questions and the scoreboard (a computer, tablet or TV works best); everyone answers on their own phone. Keep this app open while you play.</p>
        {game !== 'whoami' && <fieldset style={{ border: 0, padding: 0, margin: '8px 0' }}>
          <legend className="muted small">Categories</legend>
          <div className="chips">{CATS.map((c) => <button key={c.id} type="button" className={`chip${cats.includes(c.id) ? ' sel' : ''}`} aria-pressed={cats.includes(c.id)} onClick={() => toggle(c.id)}>{c.icon} {c.name}</button>)}</div>
        </fieldset>}
        <div className="live-form" style={{ maxWidth: 'none' }}>
          {game === 'crowns' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><label>Time on the clock<select value={minutes} onChange={(e) => setMinutes(+e.target.value)}>{[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select></label><p className="muted small" style={{ flex: '1 1 14rem' }}>Each category crowned needs {3} right answers, so {cats.length} crowns is {cats.length * 3} right answers. The game ends when someone has them all or time runs out.</p></div>}
          {game === 'whoami' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><label>People<select value={people} onChange={(e) => setPeople(+e.target.value)}>{[5, 8, 12, 16].map((n) => <option key={n}>{n}</option>)}</select></label><label>Time for each clue<select value={clueSec} onChange={(e) => setClueSec(+e.target.value)}>{[8, 12, 20].map((n) => <option key={n} value={n}>{n} seconds</option>)}</select></label></div>}
          {game === 'quiz' && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <label>Questions<select value={count} onChange={(e) => setCount(+e.target.value)}>{[8, 12, 16, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label>Difficulty<select value={level} onChange={(e) => setLevel(e.target.value as 'easy')}><option value="easy">Easier</option><option value="mixed">Mixed</option><option value="hard">Harder</option></select></label>
            <label>Time to answer<select value={time} onChange={(e) => setTime(+e.target.value)}>{TIMES.map((t) => <option key={t.s} value={t.s}>{t.label} ({t.s}s)</option>)}</select></label>
            <label>Teams<select value={teams} onChange={(e) => setTeams(+e.target.value)}><option value={0}>Everyone for themselves</option>{[2, 3, 4].map((n) => <option key={n} value={n}>{n} teams</option>)}</select></label>
          </div>}
          {game === 'quiz' && <label className="row" style={{ gap: 8, fontWeight: 400 }}><input type="checkbox" checked={elim} onChange={(e) => setElim(e.target.checked)} /> Last one standing: a wrong answer puts you out</label>}
        </div>
        {err && <div className="notice warn" role="alert">{err}</div>}
        <p><button className="btn primary big" onClick={() => void open()} disabled={busy || !bank || (game !== 'whoami' && !pool.length)}>{busy ? 'Opening the room…' : 'Open the room'}</button></p>
        <p className="muted small">{bank ? `${pool.length} questions in the chosen categories.` : 'Loading questions…'} Messages between devices are encrypted with a key made from the code, and go through a free public relay; nothing is stored.</p>
      </section>
    </div>
  );
}
