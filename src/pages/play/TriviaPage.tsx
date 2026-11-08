import { loadTriviaBank } from '../../lib/triviaBank';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATS, LEVELS, NEED, SLICE, WHEEL, bestPick, botRight, hasWon, levelOf, newPlayer, nextQuestion, shuffleOptions, wheelRotation, type CatId, type Level, type Player, type TQ } from '../../lib/trivia';
import { contextLink } from '../../chains/links';
import { recordPlay } from '../../lib/dailyGame';

type Mode = 'solo' | 'pass' | 'bot';
type Phase = 'setup' | 'spin' | 'spinning' | 'pick' | 'question' | 'reveal' | 'over';
const STATS = 'sb:trivia';
const loadStats = () => { try { return { played: 0, won: 0, crowns: 0, bestSolo: 0, ...JSON.parse(localStorage.getItem(STATS) ?? '{}') }; } catch { return { played: 0, won: 0, crowns: 0, bestSolo: 0 }; } };
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = Math.random;
const catOf = (id: string) => CATS.find((c) => c.id === id);

function Wheel({ rot, spinning, landed }: { rot: number; spinning: boolean; landed: number | null }) {
  const R = 100, C = 110;
  const pt = (deg: number, r: number) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  return (
    <div className="tv-wheel-wrap" aria-hidden="true">
      <div className="tv-pointer">▼</div>
      <svg className="tv-wheel" viewBox="0 0 220 220" style={{ transform: `rotate(${rot}deg)`, transition: spinning && !reduced() ? 'transform 3.4s cubic-bezier(.12,.7,.15,1)' : 'none' }}>
        {WHEEL.map((id, i) => {
          const a0 = i * SLICE, a1 = (i + 1) * SLICE, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [tx, ty] = pt(a0 + SLICE / 2, R * 0.66);
          const c = catOf(id);
          return (
            <g key={id} className={landed === i ? 'tv-hit' : undefined}>
              <path d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={c?.color ?? '#e9dfc2'} stroke="#fff" strokeWidth="2" />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize="22" transform={`rotate(${a0 + SLICE / 2} ${tx} ${ty})`}>{c?.icon ?? '⭐'}</text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="14" fill="#1b1405" stroke="#fff" strokeWidth="3" />
      </svg>
    </div>
  );
}

function Crowns({ p, active }: { p: Player; active: boolean }) {
  return (
    <div className={`tv-player${active ? ' on' : ''}`} aria-current={active ? 'true' : undefined}>
      <p className="tv-name">{p.bot ? '🤖 ' : ''}{p.name}{active && <span className="sr-only"> (your turn)</span>}</p>
      <div className="tv-crowns" role="img" aria-label={`${p.crowns.length} of ${CATS.length} crowns`}>
        {CATS.map((c) => {
          const got = p.crowns.includes(c.id), prog = p.progress[c.id] ?? 0;
          return <span key={c.id} className={`tv-crown${got ? ' got' : ''}`} style={{ ['--c' as string]: c.color }} title={`${c.name}: ${got ? 'crown earned' : `${prog} of ${NEED}`}`}>{got ? '👑' : <i>{prog > 0 ? prog : ''}</i>}</span>;
        })}
      </div>
    </div>
  );
}

/** Crown Quest: a trivia game with a wheel. Answer right in a category three times to win its crown; first to all six wins. */
export default function TriviaPage() {
  const [bank, setBank] = useState<Record<string, TQ[]> | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('bot');
  const [level, setLevel] = useState<Level>('medium');
  const [timer, setTimer] = useState(true);
  const [names, setNames] = useState(['Player 1', 'Player 2']);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [rot, setRot] = useState(0);
  const [landed, setLanded] = useState<number | null>(null);
  const [cat, setCat] = useState<CatId | null>(null);
  const [q, setQ] = useState<(TQ & { options: string[]; answer: number }) | null>(null);
  const [pickedI, setPickedI] = useState<number | null>(null);
  const [botPick, setBotPick] = useState<number | null>(null);
  const [hearts, setHearts] = useState(3);
  const [left, setLeft] = useState(20);
  const [note, setNote] = useState('');
  const [stats, setStats] = useState(loadStats);
  const used = useRef<Record<string, Set<string>>>({});
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => { const t = window.setTimeout(fn, reduced() ? Math.min(ms, 300) : ms); timers.current.push(t); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    let live = true;
    loadTriviaBank().then((b) => live && setBank(b)).catch(() => live && setBank(Object.fromEntries(CATS.map((c) => [c.id, [] as TQ[]]))));
    return () => { live = false; };
  }, []);
  const size = bank ? Object.values(bank).reduce((n, l) => n + l.length, 0) : 0;
  const me = players[turn];
  const isBot = !!me?.bot;

  const finish = useCallback((ps: Player[], winner: number | null) => {
    setPhase('over');
    setStats((s: ReturnType<typeof loadStats>) => { const crowns = ps.reduce((n, p) => n + (p.bot ? 0 : p.crowns.length), 0); const n = { ...s, played: s.played + 1, won: s.won + (winner !== null && !ps[winner].bot ? 1 : 0), crowns: s.crowns + crowns, bestSolo: mode === 'solo' ? Math.max(s.bestSolo, ps[0].crowns.length) : s.bestSolo }; try { localStorage.setItem(STATS, JSON.stringify(n)); } catch { /* private mode */ } return n; });
    try { recordPlay('trivia', { perfect: winner !== null && !ps[winner].bot && ps[winner].wrong === 0 }); } catch { /* ignore */ }
  }, [mode]);

  const start = () => {
    const ps = mode === 'solo' ? [newPlayer(names[0] || 'You')] : mode === 'pass' ? names.map((n, i) => newPlayer(n.trim() || `Player ${i + 1}`)) : [newPlayer(names[0] || 'You'), newPlayer('Brother Bot', true)];
    used.current = {}; setPlayers(ps); setTurn(0); setHearts(3); setCat(null); setQ(null); setLanded(null); setNote(''); setPhase('spin');
  };
  const ask = useCallback((c: CatId) => {
    const pool = bank?.[c] ?? []; const u = (used.current[c] ??= new Set());
    const nq = nextQuestion(pool, u, level, rnd);
    if (!nq) { setNote('No questions in that category yet.'); setPhase('spin'); return; }
    u.add(nq.id); setCat(c); setQ({ ...nq, ...shuffleOptions(nq, rnd) }); setPickedI(null); setBotPick(null); setLeft(20); setPhase('question');
  }, [bank, level]);

  const spin = useCallback(() => {
    if (phase !== 'spin' || !me) return;
    const k = Math.floor(rnd() * WHEEL.length);
    setNote(''); setLanded(null); setPhase('spinning'); setRot((r) => wheelRotation(r, k, 4 + Math.floor(rnd() * 3)));
    later(() => {
      setLanded(k);
      const id = WHEEL[k];
      if (id === 'pick') {
        if (me.bot) { const c = bestPick(me); setNote(`${me.name} chose ${catOf(c)?.name}.`); later(() => ask(c), 900); } else { setPhase('pick'); }
      } else if (me.crowns.includes(id as CatId)) {
        setNote(`${catOf(id)?.name}: already your crown. Spin again.`); later(() => setPhase('spin'), 1100);
      } else later(() => ask(id as CatId), 600);
    }, reduced() ? 80 : 3500);
  }, [phase, me, ask, later]);

  const settle = useCallback((chosen: number | null, who: Player) => {
    if (!q || !cat) return;
    const right = chosen === q.answer;
    setPickedI(chosen);
    const ps = players.map((p) => ({ ...p, crowns: [...p.crowns], progress: { ...p.progress } }));
    const p = ps[turn];
    if (right) { p.right++; p.progress[cat] = (p.progress[cat] ?? 0) + 1; if (p.progress[cat] >= NEED && !p.crowns.includes(cat)) { p.crowns.push(cat); setNote(`👑 ${who.name} earns the ${catOf(cat)?.name} crown!`); } else setNote(right ? 'Correct!' : ''); }
    else { p.wrong++; setNote(chosen === null ? 'Time’s up.' : 'Not quite.'); }
    setPlayers(ps); setPhase('reveal');
    if (mode === 'solo' && !right) setHearts((h) => h - 1);
  }, [q, cat, players, turn, mode]);

  const answer = useCallback((i: number | null) => { if (phase !== 'question' || !me) return; settle(i, me); }, [phase, me, settle]);

  // question clock
  useEffect(() => {
    if (phase !== 'question' || !timer || isBot) return;
    if (left <= 0) { answer(null); return; }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left, timer, isBot, answer]);
  // keys 1-4
  useEffect(() => {
    if (phase !== 'question' || isBot) return;
    const f = (e: KeyboardEvent) => { const n = +e.key; if (n >= 1 && n <= 4) answer(n - 1); };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, [phase, isBot, answer]);
  // the bot spins, then answers
  useEffect(() => { if (phase === 'spin' && isBot) { const t = window.setTimeout(spin, reduced() ? 100 : 900); return () => clearTimeout(t); } }, [phase, isBot, spin]);
  useEffect(() => {
    if (phase !== 'question' || !isBot || !q) return;
    const t = window.setTimeout(() => { const ok = botRight(level, q.d, rnd); const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer); const pickI = ok ? q.answer : wrong[Math.floor(rnd() * 3)]; setBotPick(pickI); settle(pickI, me!); }, reduced() ? 200 : 1800);
    return () => clearTimeout(t);
  }, [phase, isBot, q, level, me, settle]);

  const next = useCallback(() => {
    if (!q || phase !== 'reveal') return;
    const right = pickedI === q.answer;
    const winnerI = players.findIndex(hasWon);
    if (winnerI >= 0) { finish(players, winnerI); return; }
    if (mode === 'solo') { if (hearts <= 0) { finish(players, null); return; } setPhase('spin'); return; }
    if (!right) setTurn((t) => (t + 1) % players.length);
    setPhase('spin'); setLanded(null);
  }, [q, phase, pickedI, players, mode, hearts, finish]);
  // the bot moves on by itself after showing its answer
  useEffect(() => { if (phase === 'reveal' && isBot) { const t = window.setTimeout(next, reduced() ? 300 : 2400); return () => clearTimeout(t); } }, [phase, isBot, next]);

  const winner = players.find(hasWon);
  const link = q?.src ? contextLink(q.src as never) : null;
  const best = useMemo(() => [...players].sort((a, b) => b.crowns.length - a.crowns.length)[0], [players]);

  if (phase === 'setup') {
    return (
      <div className="page trivia">
        <p className="small no-print"><Link to="/play">← Games</Link></p>
        <h1>Crown Quest</h1>
        <p className="lede">Spin the wheel, answer in a category, and win its crown with three right answers. Collect all six crowns first.</p>
        <div className="tv-cats" aria-label="The six categories">{CATS.map((c) => <span key={c.id} className="tv-cat-chip" style={{ ['--c' as string]: c.color }}>{c.icon} {c.name}</span>)}</div>
        <h2 className="chain-h2">Who’s playing?</h2>
        <div className="chips" role="group" aria-label="Mode">
          {([['bot', 'Against Brother Bot'], ['pass', 'Pass the phone'], ['solo', 'On my own']] as [Mode, string][]).map(([m, l]) => <button key={m} className={`chip${mode === m ? ' sel' : ''}`} aria-pressed={mode === m} onClick={() => { setMode(m); setNames((n) => (m === 'pass' && n.length < 2 ? ['Player 1', 'Player 2'] : n)); }}>{l}</button>)}
        </div>
        {mode === 'pass' ? (
          <div className="tv-names">{names.map((n, i) => <input key={i} value={n} onChange={(e) => setNames((a) => a.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Player ${i + 1} name`} maxLength={14} />)}
            <span>{names.length < 4 && <button className="btn small" onClick={() => setNames((a) => [...a, `Player ${a.length + 1}`])}>Add a player</button>} {names.length > 2 && <button className="btn small ghost" onClick={() => setNames((a) => a.slice(0, -1))}>Remove one</button>}</span></div>
        ) : <div className="tv-names"><input value={names[0]} onChange={(e) => setNames((a) => [e.target.value, ...a.slice(1)])} aria-label="Your name" maxLength={14} /></div>}
        <h2 className="chain-h2">How hard?</h2>
        <div className="chips" role="group" aria-label="Level">{LEVELS.map((l) => <button key={l.id} className={`chip${level === l.id ? ' sel' : ''}`} aria-pressed={level === l.id} onClick={() => setLevel(l.id)}>{l.label}</button>)}</div>
        <p className="muted small">{levelOf(level).blurb}</p>
        <label className="tv-check"><input type="checkbox" checked={timer} onChange={(e) => setTimer(e.target.checked)} /> 20-second timer on each question</label>
        <p><button className="btn primary big" onClick={start} disabled={!bank || size < 12}>{bank ? (size < 12 ? 'Questions are on their way' : 'Start the game') : 'Loading questions…'}</button></p>
        <p className="muted small">{size ? `${size} questions, each checked against a source.` : ''} {stats.played ? `You have played ${stats.played} game${stats.played === 1 ? '' : 's'}, won ${stats.won}, and earned ${stats.crowns} crowns.` : ''}</p>
      </div>
    );
  }

  if (phase === 'over') {
    const won = winner && !winner.bot;
    return (
      <div className="page trivia tv-over">
        <h1>{winner ? (winner.bot ? `${winner.name} wins this one` : `${winner.name} wins!`) : 'Game over'}</h1>
        <p className="lede">{winner ? `All six crowns, ${winner.right} right answers.` : `${best?.name} earned ${best?.crowns.length ?? 0} of ${CATS.length} crowns.`}</p>
        <div className="tv-board">{players.map((p) => <Crowns key={p.name} p={p} active={false} />)}</div>
        <p className="muted small">{players.map((p) => `${p.name}: ${p.right} right, ${p.wrong} wrong`).join(' · ')}</p>
        {won && <p className="tv-confetti" aria-hidden="true">🎉 👑 🎉</p>}
        <p><button className="btn primary" onClick={start}>Play again</button> <button className="btn" onClick={() => setPhase('setup')}>Change settings</button> <Link className="btn ghost" to="/play">All games</Link></p>
      </div>
    );
  }

  return (
    <div className="page trivia">
      <h1 className="sr-only">Crown Quest</h1>
      <div className="tv-board">{players.map((p, i) => <Crowns key={p.name + i} p={p} active={i === turn} />)}</div>
      {mode === 'solo' && <p className="tv-hearts" aria-label={`${hearts} lives left`}>{'❤️'.repeat(Math.max(0, hearts))}{'🤍'.repeat(Math.max(0, 3 - hearts))}</p>}
      {(phase === 'spin' || phase === 'spinning' || phase === 'pick') && (
        <section className="tv-spin" aria-label="The wheel">
          <Wheel rot={rot} spinning={phase === 'spinning'} landed={landed} />
          <p className="tv-note" aria-live="polite">{note || (phase === 'spin' ? (isBot ? `${me?.name} is about to spin…` : `${me?.name}, spin the wheel!`) : phase === 'spinning' ? 'Spinning…' : '')}</p>
          {phase === 'spin' && !isBot && <button className="btn primary big" onClick={spin}>Spin</button>}
          {phase === 'pick' && (
            <div className="tv-pick"><p><strong>Your pick!</strong> Choose any category you haven’t crowned.</p>
              <div className="tv-cats">{CATS.filter((c) => !me?.crowns.includes(c.id)).map((c) => <button key={c.id} className="tv-cat-chip tv-cat-btn" style={{ ['--c' as string]: c.color }} onClick={() => ask(c.id)}>{c.icon} {c.name}</button>)}</div></div>
          )}
        </section>
      )}
      {(phase === 'question' || phase === 'reveal') && q && cat && (
        <section className="tv-q" style={{ ['--c' as string]: catOf(cat)?.color }} aria-label="Question">
          <p className="tv-qcat">{catOf(cat)?.icon} {catOf(cat)?.name} <span className="muted small">· {me?.progress[cat] ?? 0} of {NEED} for the crown</span></p>
          {phase === 'question' && timer && !isBot && <div className="tv-bar" role="timer" aria-label={`${left} seconds left`}><i style={{ width: `${(left / 20) * 100}%` }} /></div>}
          <h2 className="tv-qtext">{q.q}</h2>
          <ul className="tv-opts">
            {q.options.map((o, i) => {
              const done = phase === 'reveal';
              const cls = done ? (i === q.answer ? ' right' : i === pickedI ? ' wrong' : ' dim') : '';
              return <li key={i}><button className={`tv-opt${cls}`} disabled={done || isBot} onClick={() => answer(i)}><span className="tv-key">{i + 1}</span>{o}{done && i === botPick && isBot && <em> (Brother Bot’s answer)</em>}</button></li>;
            })}
          </ul>
          {isBot && phase === 'question' && <p className="muted small">Brother Bot is thinking…</p>}
          {phase === 'reveal' && (
            <div className={`tv-why ${pickedI === q.answer ? 'ok' : 'no'}`} aria-live="polite">
              <p><strong>{note}</strong> {q.why}</p>
              {link && <p className="small">Source: <Link to={link.to}>{q.src.label}</Link></p>}
              {!isBot && <button className="btn primary" onClick={next} autoFocus>{players.some(hasWon) ? 'See the result' : pickedI === q.answer ? 'Spin again' : mode === 'solo' ? (hearts <= 0 ? 'See the result' : 'Spin again') : `${players[(turn + 1) % players.length]?.name}’s turn`}</button>}
            </div>
          )}
        </section>
      )}
      <p className="small no-print"><button className="linklike" onClick={() => setPhase('setup')}>Leave the game</button></p>
    </div>
  );
}
