import GameHelp from '../../components/GameHelp';
import { loadTriviaBank } from '../../lib/triviaBank';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATS, LEVELS, NEED, SLICE, WHEEL, bestPick, botRight, hasWon, levelOf, newPlayer, nextQuestion, shuffleOptions, wheelRotation, type CatId, type Level, type Player, type TQ } from '../../lib/trivia';
import { contextLink } from '../../chains/links';
import { isPractice, recordPlay } from '../../lib/dailyGame';
import { Anim, Art, art3d } from '../../arcade/art';
import { blip, burst } from '../../arcade/fx';
import '../../styles/crownquest.css';

type Mode = 'solo' | 'pass' | 'bot';
type Phase = 'setup' | 'spin' | 'spinning' | 'pick' | 'question' | 'reveal' | 'over';
const STATS = 'sb:trivia';
const loadStats = () => { try { return { played: 0, won: 0, crowns: 0, bestSolo: 0, ...JSON.parse(localStorage.getItem(STATS) ?? '{}') }; } catch { return { played: 0, won: 0, crowns: 0, bestSolo: 0 }; } };
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = Math.random;
const catOf = (id: string) => CATS.find((c) => c.id === id);
/** each category's colour and the 3D character that stands for it (the colours are the game's own) */
const LOOK: Record<string, { c: string; dark: string; art: string }> = {
  scripture: { c: '#2f8cff', dark: '#1456b8', art: 'open-book' },
  saints: { c: '#ff4fa3', dark: '#b0206f', art: 'dove' },
  history: { c: '#ffc21a', dark: '#b88400', art: 'castle' },
  doctrine: { c: '#8a4dff', dark: '#4f22b8', art: 'light-bulb' },
  liturgy: { c: '#ff7a1a', dark: '#b34a00', art: 'bell' },
  prayer: { c: '#2fc46f', dark: '#14803f', art: 'folded-hands' },
  pick: { c: '#ffffff', dark: '#9aa0c0', art: 'crown' },
};
const AVATARS = ['prince', 'princess', 'person', 'old-woman'];

function Wheel({ rot, spinning, landed }: { rot: number; spinning: boolean; landed: number | null }) {
  const R = 104, C = 120;
  const pt = (deg: number, r: number) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  return (
    <div className="tv-wheel-wrap" aria-hidden="true">
      <svg className="tv-pointer-svg" viewBox="0 0 40 46"><path d="M20 44 L4 8 Q20 -4 36 8 Z" fill="#fff" stroke="#6a1a9a" strokeWidth="3" strokeLinejoin="round" /><circle cx="20" cy="14" r="5" fill="#ff4fa3" /></svg>
      <svg className="tv-wheel" viewBox="0 0 240 240" style={{ transform: `rotate(${rot}deg)`, transition: spinning && !reduced() ? 'transform 3.4s cubic-bezier(.12,.7,.15,1)' : 'none' }}>
        <defs>
          {WHEEL.map((id) => { const l = LOOK[id] ?? LOOK.pick; return (
            <radialGradient key={id} id={`tvg-${id}`} cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor={l.c} /><stop offset="100%" stopColor={l.dark} /></radialGradient>
          ); })}
        </defs>
        <circle cx={C} cy={C} r="118" fill="#2a0e6a" />
        {WHEEL.map((id, i) => {
          const a0 = i * SLICE, a1 = (i + 1) * SLICE, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [tx, ty] = pt(a0 + SLICE / 2, R * 0.62);
          const l = LOOK[id] ?? LOOK.pick;
          return (
            <g key={id} className={landed === i ? 'tv-hit' : undefined}>
              <path d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={`url(#tvg-${id})`} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
              <g transform={`rotate(${a0 + SLICE / 2} ${tx} ${ty})`}><image href={art3d(l.art)} x={tx - 21} y={ty - 21} width="42" height="42" /></g>
            </g>
          );
        })}
        {Array.from({ length: WHEEL.length * 2 }, (_, i) => { const [x, y] = pt((i * SLICE) / 2, 111); return <circle key={i} cx={x} cy={y} r="3.4" fill={i % 2 ? '#ffe27a' : '#fff'} />; })}
        <circle cx={C} cy={C} r="22" fill="#ffd23f" stroke="#fff" strokeWidth="4" /><circle cx={C} cy={C} r="12" fill="#ff4fa3" stroke="#fff" strokeWidth="3" />
      </svg>
      <i className="tv-gloss" />
    </div>
  );
}

function Crowns({ p, active, avatar }: { p: Player; active: boolean; avatar: string }) {
  return (
    <div className={`tv-player${active ? ' on' : ''}`} aria-current={active ? 'true' : undefined}>
      <div className="tv-pl-head"><span className="tv-avatar"><Art n={p.bot ? 'old-man' : avatar} size={34} /></span><p className="tv-name">{p.name}{active && <span className="sr-only"> (your turn)</span>}</p><span className="tv-crowncount" aria-hidden="true"><Art n="crown" size={18} />{p.crowns.length}</span></div>
      <div className="tv-crowns" role="img" aria-label={`${p.crowns.length} of ${CATS.length} crowns`}>
        {CATS.map((c) => {
          const got = p.crowns.includes(c.id), prog = p.progress[c.id] ?? 0, l = LOOK[c.id];
          return (
            <span key={c.id} className={`tv-crown${got ? ' got' : ''}`} style={{ ['--c' as string]: l.c, ['--d' as string]: l.dark }} title={`${c.name}: ${got ? 'crown earned' : `${prog} of ${NEED}`}`}>
              <Art n={l.art} size={22} />
              {got ? <b className="tv-crown-badge"><Art n="crown" size={14} /></b> : prog > 0 ? <b className="tv-crown-badge pips">{prog}</b> : null}
            </span>
          );
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
  const [crownFor, setCrownFor] = useState<{ cat: CatId; who: string } | null>(null);
  useEffect(() => { if (!crownFor) return; const t = window.setTimeout(() => setCrownFor(null), 2600); return () => window.clearTimeout(t); }, [crownFor]);
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
    setStats((s: ReturnType<typeof loadStats>) => { const crowns = ps.reduce((n, p) => n + (p.bot ? 0 : p.crowns.length), 0); const n = { ...s, played: s.played + 1, won: s.won + (winner !== null && !ps[winner].bot ? 1 : 0), crowns: s.crowns + crowns, bestSolo: mode === 'solo' ? Math.max(s.bestSolo, ps[0].crowns.length) : s.bestSolo }; try { if (!isPractice()) localStorage.setItem(STATS, JSON.stringify(n)); } catch { /* private mode */ } return n; });
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
    if (right) { p.right++; p.progress[cat] = (p.progress[cat] ?? 0) + 1; if (p.progress[cat] >= NEED && !p.crowns.includes(cat)) { p.crowns.push(cat); setNote(`${who.name} earns the ${catOf(cat)?.name} crown!`); setCrownFor({ cat, who: who.name }); burst(); blip('win'); } else setNote(right ? 'Correct!' : ''); }
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
      <div className="page trivia cq">
        <p className="small no-print"><Link to="/play">← Games</Link></p>
        <h1>Crown Quest</h1>
        <GameHelp how={["Spin the wheel to land on a category and answer a question.", "Three right answers in a category win its crown. First to all six crowns wins.", "Play against the Bot, pass the phone, or play alone."]} />
        <p className="lede">Spin the wheel, answer in a category, and win its crown with three right answers. Collect all six crowns first.</p>
        <div className="tv-cats" aria-label="The six categories">{CATS.map((c) => <span key={c.id} className="tv-cat-chip" style={{ ['--c' as string]: LOOK[c.id].c, ['--d' as string]: LOOK[c.id].dark }}><Art n={LOOK[c.id].art} size={34} /> <b>{c.name}</b></span>)}</div>
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
      <div className="page trivia cq tv-over">
        <h1>{winner ? (winner.bot ? `${winner.name} wins this one` : `${winner.name} wins!`) : 'Game over'}</h1>
        <p className="lede">{winner ? `All six crowns, ${winner.right} right answers.` : `${best?.name} earned ${best?.crowns.length ?? 0} of ${CATS.length} crowns.`}</p>
        <div className="tv-board">{players.map((p, i) => <Crowns key={p.name + i} p={p} active={false} avatar={AVATARS[i % AVATARS.length]} />)}</div>
        <p className="muted small">{players.map((p) => `${p.name}: ${p.right} right, ${p.wrong} wrong`).join(' · ')}</p>
        {won && <p className="tv-confetti" aria-hidden="true">🎉 👑 🎉</p>}
        <p><button className="btn primary" onClick={start}>Play again</button> <button className="btn" onClick={() => setPhase('setup')}>Change settings</button> <Link className="btn ghost" to="/play">All games</Link></p>
      </div>
    );
  }

  return (
    <div className="page trivia cq">
      <h1 className="sr-only">Crown Quest</h1>
      <div className="tv-board">{players.map((p, i) => <Crowns key={p.name + i} p={p} active={i === turn} avatar={AVATARS[i % AVATARS.length]} />)}</div>
      {mode === 'solo' && <p className="tv-hearts" aria-label={`${hearts} lives left`}>{'❤️'.repeat(Math.max(0, hearts))}{'🤍'.repeat(Math.max(0, 3 - hearts))}</p>}
      {(phase === 'spin' || phase === 'spinning' || phase === 'pick') && (
        <section className="tv-spin" aria-label="The wheel">
          <Wheel rot={rot} spinning={phase === 'spinning'} landed={landed} />
          <p className="tv-note" aria-live="polite">{note || (phase === 'spin' ? (isBot ? `${me?.name} is about to spin…` : `${me?.name}, spin the wheel!`) : phase === 'spinning' ? 'Spinning…' : '')}</p>
          {phase === 'spin' && !isBot && <button className="btn primary big tv-spin-btn" onClick={spin}>Spin!</button>}
          {phase === 'pick' && (
            <div className="tv-pick"><p><strong>Your pick!</strong> Choose any category you haven’t crowned.</p>
              <div className="tv-cats">{CATS.filter((c) => !me?.crowns.includes(c.id)).map((c) => <button key={c.id} className="tv-cat-chip tv-cat-btn" style={{ ['--c' as string]: LOOK[c.id].c, ['--d' as string]: LOOK[c.id].dark }} onClick={() => ask(c.id)}><Art n={LOOK[c.id].art} size={34} /> <b>{c.name}</b></button>)}</div></div>
          )}
        </section>
      )}
      {crownFor && (
        <div className="arc-win tv-crown-win" role="status" style={{ ['--c' as string]: LOOK[crownFor.cat].c }}>
          <Anim c="1f451" size={120} /><strong>Crown!</strong><small>{crownFor.who} wins {catOf(crownFor.cat)?.name}</small>
        </div>
      )}
      {(phase === 'question' || phase === 'reveal') && q && cat && (
        <section className="tv-q" style={{ ['--c' as string]: LOOK[cat].c, ['--d' as string]: LOOK[cat].dark }} aria-label="Question">
          <div className="tv-qbg" aria-hidden="true" />
          <div className="tv-qhead">
            <div className={`tv-qchar${left <= 5 && phase === 'question' && timer && !isBot ? ' low' : ''}`} style={{ ['--p' as string]: timer && !isBot && phase === 'question' ? `${(left / 20) * 100}%` : '100%' }}>
              <Art n={LOOK[cat].art} size={62} />
              {phase === 'question' && timer && !isBot && <span className="tv-secs" role="timer" aria-label={`${left} seconds left`}>{left}</span>}
            </div>
            <div className="tv-qtitle">
              <p className="tv-qcat">{catOf(cat)?.name}</p>
              <p className="tv-qprog" aria-label={`${me?.progress[cat] ?? 0} of ${NEED} for the crown`}>{Array.from({ length: NEED }, (_, i) => <i key={i} className={i < (me?.progress[cat] ?? 0) ? 'on' : ''}><Art n="crown" size={20} /></i>)}</p>
            </div>
          </div>
          <h2 className="tv-qtext">{q.q}</h2>
          <ul className="tv-opts">
            {q.options.map((o, i) => {
              const done = phase === 'reveal';
              const cls = done ? (i === q.answer ? ' right' : i === pickedI ? ' wrong' : ' dim') : '';
              return <li key={i}><button className={`tv-opt${cls}`} disabled={done || isBot} onClick={() => answer(i)}><span className="tv-key">{done && i === q.answer ? <Art n="check-mark-button" size={26} /> : done && i === pickedI ? <Art n="cross-mark" size={26} /> : i + 1}</span><span className="tv-otext">{o}</span>{done && i === botPick && isBot && <em> (Brother Bot’s answer)</em>}</button></li>;
            })}
          </ul>
          {isBot && phase === 'question' && <p className="tv-think">Brother Bot is thinking…</p>}
          {phase === 'reveal' && (
            <div className={`tv-why ${pickedI === q.answer ? 'ok' : 'no'}`} aria-live="polite">
              <p><strong>{note}</strong> {q.why}</p>
              {link && <p className="small">Source: <Link to={link.to}>{q.src.label}</Link></p>}
              {!isBot && <button className="btn primary tv-continue" onClick={next} autoFocus>{players.some(hasWon) ? 'See the result' : pickedI === q.answer ? 'Spin again' : mode === 'solo' ? (hearts <= 0 ? 'See the result' : 'Spin again') : `${players[(turn + 1) % players.length]?.name}’s turn`}</button>}
            </div>
          )}
        </section>
      )}
      <p className="small no-print"><button className="linklike" onClick={() => setPhase('setup')}>Leave the game</button></p>
    </div>
  );
}
