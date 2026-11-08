import ShareButton from '../components/ShareButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { randomName, useCountdown } from './client';
import { useHostLink, usePlayerLink } from './hooks';
import { joinRoom, peekRoom, type HostLink, type PlayerLink } from './link';
import type { CrownTrack, LiveSlide, LiveView } from './types';
import InlinePlayer from '../components/InlinePlayer';
import { recordSession, type HostMeta } from '../teach/store';
import { embedFor } from '../lib/embed';
import { CATS } from '../lib/trivia';
import QrCode from './QrCode';

/** Always-visible connection status: what is wrong, in plain words, and a button that makes a fresh connection. */
export function ConnChip({ state, link, host }: { state: string; link: { reconnect(): void; relayHost?: () => string } | null; host?: boolean }) {
  if (state === 'live') return <span className="live-chip lv-ok" role="status" title={link?.relayHost?.() ? `Connected through ${link.relayHost()}` : 'Connected'}>● Connected</span>;
  const label = state === 'away' ? 'Host is away, waiting…' : state === 'lost' ? (host ? 'Offline, trying again…' : 'Connection lost, trying again…') : 'Connecting…';
  return <span className="live-chip warn lv-chip" role="status">{label}{link && <button type="button" className="btn small" onClick={() => link.reconnect()}>Reconnect</button>}</span>;
}

const catOf = (id: string) => CATS.find((c) => c.id === id);
/** one player's crowns: a crown for each finished category, and 1 of 3 style progress for the rest */
function CrownRack({ cats, crowns, progress, need }: { cats: string[]; crowns: string[]; progress: Record<string, number>; need: number }) {
  return (
    <span className="lv-rack" role="img" aria-label={`${crowns.length} of ${cats.length} crowns`}>
      {cats.map((c) => { const k = catOf(c), got = crowns.includes(c); return <span key={c} className={`lv-crown${got ? ' got' : ''}`} style={{ ['--c' as string]: k?.color ?? '#888' }} title={`${k?.name ?? c}: ${got ? 'crown earned' : `${progress[c] ?? 0} of ${need}`}`}>{got ? '👑' : <i>{k?.icon ?? '?'}<b>{progress[c] ?? 0}</b></i>}</span>; })}
    </span>
  );
}
function CrownBoard({ v, me }: { v: LiveView; me?: string }) {
  const c = v.crowns!;
  return (
    <ol className="lv-crownboard" aria-label="Race to six crowns">
      {c.track.map((t: CrownTrack, i) => (
        <li key={t.id} className={`${t.id === me ? 'me' : ''}${t.finished ? ' won' : ''}`}>
          <span className="rank">{i + 1}</span><span className="nm">{t.name}{t.finished ? ' 🏁' : t.streak >= 3 ? ` 🔥${t.streak}` : ''}</span>
          <CrownRack cats={c.cats} crowns={t.crowns} progress={t.progress} need={c.need} />
          <span className="pts">{t.crowns.length}/{c.goal}</span>
        </li>
      ))}
    </ol>
  );
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** The player's side of Crown Quest: spin, answer in the category, three right answers earn its crown. */
function CrownsPlay({ v, link, now }: { v: LiveView; link: PlayerLink; now: () => number }) {
  const c = v.crowns!, mine = c.mine;
  const left = useCountdown(c.deadline, now);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const key = `${mine?.step}:${mine?.cat}:${mine?.feedback?.n}:${mine?.landed}`;
  useEffect(() => { setBusy(false); setText(''); }, [key]);
  const send = async (val: unknown) => { setBusy(true); try { await link.answer(val); } catch { setBusy(false); } };
  const fb = mine?.feedback, q = mine?.question, cat = mine?.cat ? catOf(mine.cat) : undefined;
  const open = c.cats.filter((x) => !mine?.crowns.includes(x));
  return (
    <div className="lv-crowns">
      <div className="live-clock" role="timer">⏳ {mmss(left)}</div>
      {mine && <CrownRack cats={c.cats} crowns={mine.crowns} progress={mine.progress} need={c.need} />}
      {fb && <div className={`run-fb ${fb.ok ? 'ok' : 'no'}`} role="status" key={fb.n}><strong>{fb.crowned ? `👑 You earned the ${catOf(fb.crowned)?.name ?? fb.crowned} crown!` : fb.ok ? '✓ Right!' : '✗ Not quite.'}</strong>{!fb.ok && <> Right answer: <em>{fb.correct.map((x) => (fb.options ? fb.options[Number(x)] : String(x))).join(', ')}</em>.</>}{fb.why && <span className="muted"> {fb.why}</span>}</div>}
      {mine?.step === 'spin' && <div className="live-center"><p className="muted">{mine.crowns.length ? `${mine.crowns.length} of ${c.goal} crowns. ` : ''}Spin the wheel to find your category.</p><button className="btn primary big" disabled={busy} onClick={() => void send({ spin: true })}>🎡 Spin the wheel</button></div>}
      {mine?.step === 'pick' && <div className="live-center"><p><strong>Your pick!</strong> Choose any category you have not crowned.</p><div className="chips">{open.map((id) => { const k = catOf(id); return <button key={id} className="chip" disabled={busy} style={{ ['--c' as string]: k?.color }} onClick={() => void send({ pick: id })}>{k?.icon} {k?.name ?? id} <span className="muted small">{mine.progress[id] ?? 0}/{c.need}</span></button>; })}</div></div>}
      {mine?.step === 'question' && q && (
        <>
          <p className="muted small">{cat?.icon} {cat?.name ?? q.cat} · {mine.progress[q.cat] ?? 0} of {c.need} for the crown</p>
          <h2 className="live-q">{q.q}</h2>
          {(q.type === 'mc' || q.type === 'tf') && <div className={`live-opts n${q.options!.length}`}>{q.options!.map((o, i) => <button key={i} disabled={busy} className={`live-opt o${i % 4}`} onClick={() => void send(i)}><span className="shape" aria-hidden="true">{SHAPES[i]}</span>{o}</button>)}</div>}
          {q.type === 'text' && <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) void send([text.trim()]); }} className="live-form"><input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="Type your answer" aria-label="Your answer" /><button className="btn primary big" disabled={!text.trim() || busy}>Lock in</button></form>}
        </>
      )}
      <CrownBoard v={v} me={v.me?.id} />
    </div>
  );
}
function CrownsHost({ v, now, onEnd }: { v: LiveView; now: () => number; onEnd: () => void }) {
  const left = useCountdown(v.crowns!.deadline, now);
  return (
    <div className="live-center" style={{ maxWidth: 900 }}>
      <div className="live-clock" role="timer">⏳ {mmss(left)}</div>
      <h2 style={{ margin: '4px 0' }}>Crown Quest: first to {v.crowns!.goal} crowns</h2>
      <p className="muted small">Three right answers in a category earn its crown.</p>
      <CrownBoard v={v} />
      <button className="btn" onClick={() => confirm('End the game now?') && onEnd()}>End now</button>
    </div>
  );
}
/** Who Am I?: the clues that have appeared so far, newest last, with a note on when the next one comes */
function Clues({ q, now }: { q: NonNullable<LiveView['question']>; now: () => number }) {
  const left = useCountdown(q.clueEndsAt ?? 0, now);
  if (!q.clues) return null;
  return (
    <div className="lv-clues">
      <ol>{q.clues.map((c, i) => <li key={i} className={i === q.clues!.length - 1 ? 'new' : ''}>{c}</li>)}</ol>
      <p className="muted small">Clue {(q.clueIndex ?? 0) + 1} of {q.clueCount}. {q.clueEndsAt ? `Next clue in ${Math.max(0, Math.ceil(left))}s. Fewer clues, more points.` : 'That is the last clue.'}</p>
    </div>
  );
}

const SHAPES = ['A', 'B', 'C', 'D', 'E', 'F'];
const keyOf = (code: string) => `sb:live:host:${code}`;
const tokOf = (code: string) => `sb:live:player:${code}`;
const read = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]}`;

export function SlideView({ s }: { s: LiveSlide }) {
  const e = s.videoId ? embedFor(`https://www.youtube.com/watch?v=${s.videoId}`) : null;
  return (
    <div className="live-slide">
      <div className="live-slide-label">{s.label}</div>
      {s.title && <h2>{s.title}</h2>}
      {s.body && (s.ref ? <blockquote><p>{s.body}</p><footer>{s.ref}</footer></blockquote> : <p>{s.body}</p>)}
      {s.items && s.items.length > 0 && <ul>{s.items.map((t) => <li key={t}>{t}</li>)}</ul>}
      {s.img && <figure><img src={s.img.src} alt={s.img.alt} /></figure>}
      {e && <InlinePlayer embed={e} title={s.title ?? 'Video'} />}
    </div>
  );
}

function Timer({ deadline, total, now }: { deadline: number; total: number; now: () => number }) {
  const left = useCountdown(deadline, now);
  const f = Math.min(1, Math.max(0, left / Math.max(1, total)));
  const R = 22, C = 2 * Math.PI * R;
  return (
    <div className="live-timer" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><circle cx="26" cy="26" r={R} className="ring-bg" /><circle cx="26" cy="26" r={R} className={`ring${f < 0.25 ? ' low' : ''}`} strokeDasharray={C} strokeDashoffset={C * (1 - f)} transform="rotate(-90 26 26)" /></svg>
      <span>{Math.ceil(left)}</span>
    </div>
  );
}

function Board({ v, me }: { v: LiveView; me?: string }) {
  return (
    <ol className="live-board">
      {v.board.map((p) => (
        <li key={p.id} className={p.id === me ? 'me' : ''}>
          <span className="rank">{p.rank}</span><span className="nm">{p.name}{p.streak >= 2 ? ` 🔥${p.streak}` : ''}</span><span className="pts">{p.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
function Teams({ v }: { v: LiveView }) {
  if (!v.teams) return null;
  const NAMES = ['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Orange'];
  return <ul className="live-teams">{[...v.teams].sort((a, b) => b.score - a.score).map((t) => <li key={t.team} className={`t${t.team}`}><strong>{NAMES[t.team]} team</strong> <span>{t.score.toLocaleString()} avg · {t.members} players</span></li>)}</ul>;
}

/** ---------- the student's side ---------- */
export function JoinPage() {
  const params = useParams();
  const nav = useNavigate();
  const [code, setCode] = useState(params.code ?? '');
  const [name, setName] = useState(read('sb:live:name'));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [roster, setRoster] = useState<string[]>([]);
  const [rosterOnly, setRosterOnly] = useState(false);
  useEffect(() => { if (/^\d{6}$/.test(code)) peekRoom(code).then((p) => { setTitle(p.title); setRoster(p.roster ?? []); setRosterOnly(!!p.rosterOnly); }, () => { setTitle(''); setRoster([]); }); else { setTitle(''); setRoster([]); } }, [code]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const c = code.replace(/\D/g, '');
      if (roster.length && rosterOnly && !roster.includes(name)) throw new Error('Tap your name in the list.');
      const j = await joinRoom(c, name.trim() || randomName(), read(tokOf(c)) || undefined);
      write(tokOf(c), j.token); j.close(); write('sb:live:name', name.trim());
      nav(`/play/${c}`);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="page live-join">
      <h1>Join a game or class</h1>
      <p className="lede">Type the six-digit code the host is showing. No account needed.</p>
      <form onSubmit={submit} className="live-form">
        <label>Code<input inputMode="numeric" autoComplete="off" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" aria-label="Game code" className="live-code-input" autoFocus /></label>
        {title && <p className="muted small">Session: <strong>{title}</strong></p>}
        {roster.length > 0 ? (
          <fieldset className="live-roster"><legend>Tap your name</legend>
            <div className="live-roster-list">{roster.map((r) => <button type="button" key={r} className={`btn${name === r ? ' primary' : ''}`} aria-pressed={name === r} onClick={() => setName(r)}>{r}</button>)}</div>
            {!rosterOnly && <label>Not on the list?<input value={roster.includes(name) ? '' : name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Type your name" /></label>}
          </fieldset>
        ) : (
          <label>Your name<div className="row" style={{ gap: 6 }}><input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="A name everyone will know" style={{ flex: 1 }} /><button type="button" className="btn small" onClick={() => setName(randomName())}>🎲 Surprise me</button></div></label>
        )}
        {err && <div className="notice warn" role="alert">{err}</div>}
        <button className="btn primary big" disabled={busy || code.length !== 6 || (roster.length > 0 && rosterOnly && !roster.includes(name))}>{busy ? 'Joining…' : 'Join'}</button>
      </form>
    </div>
  );
}

export function PlayPage() {
  const { code = '' } = useParams();
  const token = read(tokOf(code));
  const { link, view: v, state, serverNow } = usePlayerLink(code, token);
  const [sel, setSel] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const qKey = `${v?.qIndex}:${v?.phase === 'question'}`;
  useEffect(() => { setSel([]); setText(''); setSent(false); }, [qKey]);
  if (!token) return <div className="page"><p>You have not joined this class yet.</p><Link className="btn primary" to={`/join/${code}`}>Join</Link></div>;
  if (state === 'gone') return <div className="page"><h1>This session has ended</h1><p className="muted">The teacher closed it, or it timed out.</p><Link className="btn" to="/join">Join another</Link></div>;
  if (!v) return <div className="page"><p className="muted" aria-busy="true">Connecting…</p><p><ConnChip state={state} link={link} /></p><p className="muted small">If this stays here, your host may have closed the game. <Link to="/join">Join again</Link></p></div>;
  const me = v.me;
  const q = v.question;
  const send = async (value: unknown) => { setSent(true); try { await link!.answer(value); } catch { setSent(false); } };
  const answered = sent || me?.answered;
  const toggle = (i: number) => setSel((s) => (q?.type === 'order' ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <div className="page live-play" aria-live="polite">
      <header className="live-top"><span className="live-who">{me?.name}</span><span>{me?.score.toLocaleString()} pts</span>{v.settings.teams > 0 && me?.team !== undefined && <span className={`live-chip t${me.team}`}>{['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Orange'][me.team]} team</span>}<ConnChip state={state} link={link} /></header>
      {state === 'away' && <div className="notice warn" role="status"><strong>Host is away, waiting.</strong> Their device may be asleep. Your name and score are safe, and the game carries on when they are back.</div>}
      {v.phase === 'run' && v.crowns && <CrownsPlay v={v} link={link!} now={serverNow} />}
      {v.phase === 'run' && v.run && <RunPlay v={v} link={link!} now={serverNow} />}
      {(v.phase === 'exam' || (v.phase === 'ended' && v.exam)) && v.exam && <ExamView v={v} link={link!} now={serverNow} />}
      {v.phase === 'lobby' && <div className="live-center"><h1>You’re in!</h1><p className="lede">{v.title}</p><p className="muted">Waiting for your teacher to start. Look at the big screen.</p><div className="live-bounce" aria-hidden="true">✝</div></div>}
      {v.phase === 'slides' && v.slides && <div><SlideView s={v.slides[v.slideIndex]} />{v.slides[v.slideIndex].poll && v.poll && <PollVote v={v} onVote={(i) => void link!.answer(i)} />}<p className="muted small" style={{ textAlign: 'center' }}>Slide {v.slideIndex + 1} of {v.slideCount} · your teacher is moving through the lesson</p></div>}
      {v.phase === 'question' && q && (
        <div>
          <Timer deadline={q.deadline} total={q.time} now={serverNow} />
          <p className="muted small">Question {v.qIndex + 1} of {v.qCount}{q.points === 2 ? ' · double points' : q.points === 0 ? ' · no points' : ''}</p>
          {q.clues ? <Clues q={q} now={serverNow} /> : <h2 className="live-q">{q.q}</h2>}
          {q.clues && !answered && (me?.guesses ?? 0) > 0 && <p className="live-wrong" role="status">Not that one. Try again ({me!.guesses} of 3 guesses used).</p>}
          {me?.out ? <div className="live-center"><h3>You are out, but you can still watch</h3><p className="muted">{q.answered}/{q.total} answered</p></div> : answered ? <div className="live-center"><h3>Answer locked in</h3><p className="muted">Waiting for the others… {q.answered}/{q.total} answered</p></div> : (
            <>
              {(q.type === 'mc' || q.type === 'tf') && <div className={`live-opts n${q.options!.length}`}>{q.options!.map((o, i) => <button key={i} className={`live-opt o${i % 4}`} onClick={() => send(i)}><span className="shape" aria-hidden="true">{SHAPES[i]}</span>{o}</button>)}</div>}
              {q.type === 'multi' && <><p className="muted small">Choose all that apply{q.multiHint ? ` (${q.multiHint} are right)` : ''}.</p><div className="live-opts n4">{q.options!.map((o, i) => <button key={i} className={`live-opt o${i % 4}${sel.includes(i) ? ' on' : ''}`} aria-pressed={sel.includes(i)} onClick={() => toggle(i)}><span className="shape" aria-hidden="true">{sel.includes(i) ? '✓' : SHAPES[i % 4]}</span>{o}</button>)}</div><button className="btn primary big" disabled={!sel.length} onClick={() => send(sel)}>Lock in</button></>}
              {q.type === 'text' && <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) void send([text.trim()]); }} className="live-form"><input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="Type your answer" aria-label="Your answer" autoFocus /><button className="btn primary big" disabled={!text.trim()}>Lock in</button></form>}
              {q.type === 'order' && <><p className="muted small">Tap the items in the right order, first to last.</p><ol className="live-order">{q.options!.map((o, i) => <li key={i}><button className={`live-opt o${i % 4}${sel.includes(i) ? ' on' : ''}`} onClick={() => toggle(i)}><span className="shape">{sel.includes(i) ? sel.indexOf(i) + 1 : '·'}</span>{o}</button></li>)}</ol><div className="row" style={{ gap: 8 }}><button className="btn" onClick={() => setSel([])}>Clear</button><button className="btn primary big" disabled={sel.length !== q.options!.length} onClick={() => send(sel)}>Lock in</button></div></>}
            </>
          )}
        </div>
      )}
      {(v.phase === 'results' || v.phase === 'board') && q && me && (
        <div className="live-center">
          <h1 className={me.last?.correct ? 'live-right' : 'live-wrong'}>{me.last?.correct ? '✓ Correct!' : me.answered ? '✗ Not quite' : '⏱ Time’s up'}</h1>
          {me.out && <p className="live-wrong"><strong>You are out of this round. Cheer on the others!</strong></p>}
          {me.last?.correct && <p className="live-gain">+{(me.last.points + me.last.bonus).toLocaleString()}{me.last.bonus ? ` (streak bonus ${me.last.bonus})` : ''}</p>}
          {!me.last?.correct && v.reveal && <p>Right answer: <strong>{(q.clues ? v.reveal.correct.slice(0, 1) : v.reveal.correct).map((c) => (q.options ? q.options[Number(c)] : String(c))).join(q.type === 'order' ? ' → ' : ', ')}</strong></p>}
          {v.reveal?.why && <p className="muted">{v.reveal.why}</p>}
          <p className="live-rank">You are {ordinal(me.rank)} · {me.score.toLocaleString()} points{me.streak >= 2 ? ` · 🔥 ${me.streak} in a row` : ''}</p>
        </div>
      )}
      {v.phase === 'board' && <Board v={v} me={me?.id} />}
      {v.phase === 'ended' && v.run && me && (
        <div className="live-center">
          <h1>{v.settings.mode === 'build' ? (v.run.classSteps >= v.run.classGoal ? '⛪ The cathedral is built!' : '⛪ Time’s up') : me.rank <= 3 ? ['🥇', '🥈', '🥉'][me.rank - 1] + ' You placed ' + ordinal(me.rank) : '🏁 The road is done'}</h1>
          <p className="lede">{v.run.mine?.steps ?? 0} right answers{v.settings.mode === 'build' ? ` · the class laid ${v.run.classSteps} of ${v.run.classGoal} stones` : ''}</p>
          <Link className="btn" to="/study/curriculum">Back to lessons</Link>
        </div>
      )}
      {v.phase === 'ended' && v.crowns && me && (
        <div className="live-center">
          <h1>{v.crowns.track[0]?.finished ? (v.crowns.track[0].id === me.id ? '👑 You won the race!' : `👑 ${v.crowns.track[0].name} won the race`) : '⏳ Time’s up'}</h1>
          <p className="lede">You earned {me.id ? v.crowns.track.find((t) => t.id === me.id)?.crowns.length ?? 0 : 0} of {v.crowns.goal} crowns.</p>
          <CrownBoard v={v} me={me.id} />
          <Link className="btn" to="/play">Back to games</Link>
        </div>
      )}
      {v.phase === 'ended' && me && !v.exam && !v.run && !v.crowns && (
        <div className="live-center">
          <h1>{me.rank <= 3 ? ['🥇', '🥈', '🥉'][me.rank - 1] : '🎉'} You finished {ordinal(me.rank)}</h1>
          <p className="lede">{me.score.toLocaleString()} points</p>
          <Board v={v} me={me.id} /><Teams v={v} />
          <Link className="btn" to="/study/curriculum">Back to lessons</Link>
        </div>
      )}
    </div>
  );
}

/** ---------- the teacher's side ---------- */
export function HostPage() {
  const { code = '' } = useParams();
  const { link, view: v, state, serverNow } = useHostLink(code);
  const act = (a: string, arg?: unknown) => (link ? link.act(a, arg).catch(() => undefined) : Promise.resolve());
  const meta = useMemo<HostMeta | null>(() => { try { const m = localStorage.getItem(`sb:live:meta:${code}`); return m ? (JSON.parse(m) as HostMeta) : null; } catch { return null; } }, [code]);
  const lastSaved = useRef('');
  useEffect(() => {
    if (!v || !meta || !v.results) return;
    const key = JSON.stringify([v.phase, v.results.players.map((p) => [p.name, p.score, p.correct, p.answered, p.submitted])]);
    if (lastSaved.current === key) return;
    const t = setTimeout(() => { lastSaved.current = key; void recordSession(v, meta); }, v.phase === 'ended' ? 0 : 2500);
    return () => clearTimeout(t);
  }, [v, meta]);
  const [copied, setCopied] = useState(false);
  const joinUrl = useMemo(() => `${location.origin}${location.pathname}#/join/${code}`, [code]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select')) return;
      if (!v) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (v.phase === 'slides') void act('slide', v.slideIndex + 1); else if (v.phase === 'results' || v.phase === 'board') void act('next'); }
      if (e.key === 'ArrowLeft' && v.phase === 'slides') void act('slide', v.slideIndex - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  if (state === 'gone' && !v) return <div className="page"><p>This session is not on this device, or it has ended. Open it where you started it, or start a new one.</p><Link className="btn" to="/study/curriculum">Lessons</Link></div>;
  if (state === 'gone') return <div className="page"><h1>This session has ended</h1><Link className="btn" to="/study/curriculum">Back to lessons</Link></div>;
  if (!v) return <div className="page"><p className="muted" aria-busy="true">Connecting…</p></div>;
  const q = v.question;
  const connected = v.players.filter((p) => p.connected).length;
  return (
    <div className="page live-host">
      <header className="live-top">
        <span className="live-who">{v.title}</span>
        <span>Code <strong className="live-code-sm">{v.code}</strong></span>
        <span>{connected} joined</span>
        <ConnChip state={state} link={link} host />
        <button className="btn small" onClick={() => confirm('End this session for everyone?') && act('end')} disabled={v.phase === 'ended'}>End</button>
      </header>

      {v.phase === 'lobby' && (
        <div className="live-center">
          <p className="muted">On your own device open <strong>{location.host}</strong>, choose <strong>Play online with a code</strong> (or <strong>Join a class</strong>), or open</p>
          <p className="live-url">{joinUrl}</p>
          <p className="muted">and enter the code, or point a phone camera at this square.</p>
          <div className="lv-qrbox"><QrCode text={joinUrl} label={`QR code that opens the join page for game ${v.code}`} /></div>
          <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap', margin: '0 0 8px' }}><button type="button" className="btn" onClick={() => { const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); }; try { void navigator.clipboard.writeText(joinUrl).then(done, done); } catch { done(); } }}>{copied ? 'Link copied ✓' : 'Copy link'}</button><ShareButton text={`Join my game on Cathology with the code ${v.code}`} path={`/join/${v.code}`} label="Share the invitation" className="btn" /></div>
          <div className="live-code" aria-label={`Game code ${v.code.split('').join(' ')}`}>{v.code}</div>
          <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
            <button className="btn primary big" onClick={() => act('start')} disabled={!v.slideCount && !v.qCount}>{v.settings.mode === 'exam' ? `Start the exam (${v.settings.examMinutes} min)` : v.settings.mode === 'race' ? 'Start the race' : v.settings.mode === 'crowns' ? 'Start the Crown Quest race' : v.settings.mode === 'whoami' ? 'Start Who Am I?' : v.settings.mode === 'build' ? 'Start building' : v.slideCount ? 'Start the lesson' : 'Start the game'}</button>
            {v.slideCount > 0 && v.qCount > 0 && v.settings.mode === 'game' && <button className="btn" onClick={() => act('quiz')}>Skip to the quiz</button>}
            <button className="btn" aria-pressed={v.locked} onClick={() => act('lock', !v.locked)}>{v.locked ? '🔒 Locked' : '🔓 Lock the room'}</button>
          </div>
          <p className="muted small">{v.slideCount} slides · {v.qCount} questions{v.settings.teams ? ` · ${v.settings.teams} teams` : ''}</p>
          <ul className="live-players">{v.players.map((p) => <li key={p.id} className={p.connected ? '' : 'off'}>{p.name}{v.settings.teams ? ` · ${['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Orange'][p.team ?? 0]}` : ''} <button className="icon-btn" aria-label={`Remove ${p.name}`} onClick={() => act('kick', p.id)}>✕</button></li>)}{!v.players.length && <li className="muted">Waiting for students…</li>}</ul>
        </div>
      )}

      {v.phase === 'slides' && v.slides && (
        <div>
          <SlideView s={v.slides[v.slideIndex]} />
          {v.slides[v.slideIndex].poll && v.poll && <PollBars v={v} />}
          <div className="live-nav">
            <button className="btn" disabled={v.slideIndex === 0} onClick={() => act('slide', v.slideIndex - 1)}>← Back</button>
            <span>{v.slideIndex + 1} / {v.slideCount} · {connected} watching</span>
            {v.slideIndex < v.slideCount - 1 ? <button className="btn primary" onClick={() => act('slide', v.slideIndex + 1)}>Next →</button> : (v.qCount ? <button className="btn primary" onClick={() => act('quiz')}>Start the quiz →</button> : <button className="btn primary" onClick={() => act('end')}>Finish the lesson ✓</button>)}
            {v.qCount > 0 && v.slideIndex < v.slideCount - 1 && <button className="btn small" onClick={() => act('quiz')}>Skip to quiz</button>}
          </div>
        </div>
      )}

      {v.phase === 'question' && q && (
        <div>
          <Timer deadline={q.deadline} total={q.time} now={serverNow} />
          <p className="muted">Question {v.qIndex + 1} of {v.qCount} · {q.answered}/{q.total} answered{q.points === 2 ? ' · double points' : ''}</p>
          {q.clues ? <Clues q={q} now={serverNow} /> : <h2 className="live-q big">{q.q}</h2>}
          {q.clues && <ul className="live-players lv-who">{v.players.map((p) => <li key={p.id} className={p.answered ? 'done' : ''}>{p.answered ? '✓ ' : ''}{p.name}</li>)}</ul>}
          {q.options && <div className={`live-opts n${q.options.length}`}>{q.options.map((o, i) => <div key={i} className={`live-opt o${i % 4} static`}><span className="shape" aria-hidden="true">{q.type === 'order' ? '·' : SHAPES[i % 4]}</span>{o}</div>)}</div>}
          {q.type === 'text' && <p className="muted">Students type their answer.</p>}
          {q.type === 'multi' && <p className="muted">Select all that apply.</p>}
          {q.type === 'order' && <p className="muted">Students put these in order.</p>}
          <div className="live-nav"><button className="btn" onClick={() => act('skip')}>Show the answer now</button></div>
        </div>
      )}

      {v.phase === 'run' && v.crowns && <CrownsHost v={v} now={serverNow} onEnd={() => act('end')} />}
      {v.phase === 'run' && v.run && <RunHost v={v} now={serverNow} onEnd={() => act('end')} />}

      {v.phase === 'exam' && (
        <div className="live-center" style={{ maxWidth: 820 }}>
          <Timer deadline={v.examDeadline ?? 0} total={v.settings.examMinutes * 60} now={serverNow} />
          <h2>Exam in progress</h2>
          <p className="muted">{v.players.filter((p) => p.submitted).length} of {v.players.length} have handed in</p>
          <ul className="exam-progress">{v.players.map((p) => <li key={p.id} className={p.submitted ? 'done' : ''}><span>{p.name}</span><span className="bar"><i style={{ width: `${((p.progress ?? 0) / Math.max(1, v.qCount)) * 100}%` }} /></span><span>{p.submitted ? '✓ in' : `${p.progress ?? 0}/${v.qCount}`}</span></li>)}</ul>
          <button className="btn" onClick={() => confirm('End the exam now and collect everyone’s answers?') && act('end')}>End the exam now</button>
        </div>
      )}

      {(v.phase === 'results' || v.phase === 'board') && q && v.reveal && (
        <div>
          <h2 className="live-q">{q.q}</h2>
          {q.options && q.type !== 'order' && (
            <ul className="live-bars">{q.options.map((o, i) => { const n = v.reveal!.counts[i] ?? 0; const max = Math.max(1, ...v.reveal!.counts); const ok = v.reveal!.correct.map(Number).includes(i); return <li key={i} className={ok ? 'ok' : ''}><span className="lab">{SHAPES[i % 4]} {o} {ok && '✓'}</span><span className="bar"><i className={`o${i % 4}`} style={{ width: `${(n / max) * 100}%` }} /></span><span className="n">{n}</span></li>; })}</ul>
          )}
          {q.type === 'order' && <p>Right order: <strong>{v.reveal.correct.map((c) => q.options![Number(c)]).join(' → ')}</strong></p>}
          {q.type === 'text' && <p>Accepted: <strong>{v.reveal.correct.join(', ')}</strong>{v.reveal.text && Object.keys(v.reveal.text).length > 0 && <span className="muted small"> · answers given: {Object.entries(v.reveal.text).map(([k, n]) => `${k} (${n})`).join(', ')}</span>}</p>}
          {v.reveal.why && <p className="live-why">{v.reveal.why}</p>}
          {v.phase === 'board' && <><h3>Leaderboard</h3><Board v={v} /><Teams v={v} /></>}
          <div className="live-nav"><button className="btn primary big" onClick={() => act('next')}>{v.phase === 'results' ? 'Show the leaderboard →' : v.qIndex >= v.qCount - 1 ? 'Finish ✓' : 'Next question →'}</button></div>
        </div>
      )}

      {v.phase === 'ended' && (
        <div className="live-center">
          <h1>{v.settings.mode === 'exam' ? '📝 Exam results' : v.settings.mode === 'build' ? (v.run && v.run.classSteps >= v.run.classGoal ? '⛪ The cathedral is built!' : '⛪ Time’s up') : '🎉 Final results'}</h1>
          {meta && <p className="notice ok small">Saved to your class record: attendance, participation and scores. <Link to={`/teach/${meta.classId}`}>Open the class</Link></p>}
          {v.settings.mode === 'exam' && v.results && <ol className="live-board">{v.results.players.map((p, k) => <li key={p.id}><span className="rank">{k + 1}</span><span className="nm">{p.name}{p.submitted ? '' : ' (not handed in)'}</span><span className="pts">{Math.round(p.score)}%</span></li>)}</ol>}
          {v.settings.mode === 'build' && v.run && <Cathedral done={v.run.classSteps} goal={v.run.classGoal} />}
          {v.settings.mode === 'crowns' && v.crowns && <><p className="lede">{v.crowns.track[0]?.finished ? `${v.crowns.track[0].name} collected all ${v.crowns.goal} crowns first.` : 'Time ran out before anyone had every crown.'}</p><CrownBoard v={v} /></>}
          {v.settings.mode !== 'exam' && v.settings.mode !== 'build' && v.settings.mode !== 'crowns' && v.qCount > 0 && <><div className="live-podium">{[1, 0, 2].map((i) => v.board[i] && <div key={i} className={`step s${i + 1}`}><span className="medal">{['🥇', '🥈', '🥉'][i]}</span><strong>{v.board[i].name}</strong><span>{v.board[i].score.toLocaleString()}</span></div>)}</div>
          <Board v={v} /><Teams v={v} /></>}
          {v.settings.mode === 'game' && !v.qCount && <p className="muted">{v.players.length} students took part.</p>}
          <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
            <button className="btn primary" onClick={async () => { const t = await link!.csv(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = `session-${code}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }}>Download scores (CSV)</button>
            <Link className="btn" to="/study/curriculum">Back to lessons</Link>
          </div>
          <p className="muted small">The session stays open for a little while so you can download the scores.</p>
        </div>
      )}
    </div>
  );
}

/** The student's side of an exam: all the questions, one clock, answers saved as they go, hand in when done. */
function ExamView({ v, link, now }: { v: LiveView; link: PlayerLink; now: () => number }) {
  const ex = v.exam!;
  const [i, setI] = useState(0);
  const [mine, setMine] = useState<((number | string)[] | null)[]>(ex.answers);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const left = useCountdown(ex.deadline, now);
  const q = ex.questions[i];
  useEffect(() => { setText(typeof mine[i]?.[0] === 'string' ? String(mine[i]![0]) : ''); }, [i]);
  const save = (val: (number | string)[] | null) => { setMine((m) => m.map((x, k) => (k === i ? val : x))); if (val) void link.answer(val, i).catch(() => undefined); };
  const sel = (mine[i] ?? []).map(Number);
  const answeredCount = mine.filter(Boolean).length;
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  if (ex.submitted || v.phase === 'ended') {
    const r = ex.result;
    return (
      <div className="live-center">
        <h1>✓ Handed in</h1>
        {r ? <><p className="live-gain">{Math.round(r.percent)}%</p><p>{r.correct} of {r.total} right</p></> : <p className="muted">Your teacher will share your result.</p>}
        {r?.review && <ol className="exam-review">{r.review.map((x, k) => <li key={k} className={x.ok ? 'ok' : 'no'}><strong>{ex.questions[k].q}</strong><br /><span>Your answer: {x.mine ? x.mine.map((c) => ex.questions[k].options ? ex.questions[k].options![Number(c)] : String(c)).join(', ') : '(blank)'}</span><br /><span>Right answer: {x.correct.map((c) => (ex.questions[k].options ? ex.questions[k].options![Number(c)] : String(c))).join(ex.questions[k].type === 'order' ? ' → ' : ', ')}</span>{x.why && <><br /><em>{x.why}</em></>}</li>)}</ol>}
        <Link className="btn" to="/study/curriculum">Back to lessons</Link>
      </div>
    );
  }
  const submit = async () => { if (answeredCount < ex.questions.length && !confirm(`${ex.questions.length - answeredCount} questions are blank. Hand in anyway?`)) return; setBusy(true); try { await link.submit(); } finally { setBusy(false); } };
  return (
    <div>
      <div className="live-timer" role="timer" aria-label={`${mm(left)} left`}><div className="live-timer-bar"><i style={{ width: `${Math.min(100, (left / Math.max(1, v.settings.examMinutes * 60)) * 100)}%` }} /></div><span style={{ minWidth: '4.5ch' }}>{mm(left)}</span></div>
      <nav className="exam-nav" aria-label="Questions">{ex.questions.map((_, k) => <button key={k} className={`${k === i ? 'cur' : ''}${mine[k] ? ' done' : ''}`} aria-label={`Question ${k + 1}${mine[k] ? ', answered' : ''}`} onClick={() => setI(k)}>{k + 1}</button>)}</nav>
      <p className="muted small">Question {i + 1} of {ex.questions.length}{q.points === 2 ? ' · counts double' : ''}</p>
      <h2 className="live-q">{q.q}</h2>
      {(q.type === 'mc' || q.type === 'tf') && <div className={`live-opts n${q.options!.length}`}>{q.options!.map((o, k) => <button key={k} className={`live-opt o${k}${sel[0] === k ? ' on' : ''}`} aria-pressed={sel[0] === k} onClick={() => save([k])}><span className="shape" aria-hidden="true">{sel[0] === k ? '✓' : SHAPES[k]}</span>{o}</button>)}</div>}
      {q.type === 'multi' && <><p className="muted small">Choose all that apply.</p><div className="live-opts n4">{q.options!.map((o, k) => <button key={k} className={`live-opt o${k % 4}${sel.includes(k) ? ' on' : ''}`} aria-pressed={sel.includes(k)} onClick={() => { const n = sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]; save(n.length ? n : null); }}><span className="shape" aria-hidden="true">{sel.includes(k) ? '✓' : SHAPES[k % 4]}</span>{o}</button>)}</div></>}
      {q.type === 'text' && <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => save(text.trim() ? [text.trim()] : null)} maxLength={80} placeholder="Type your answer" aria-label="Your answer" style={{ width: '100%' }} />}
      {q.type === 'order' && <><p className="muted small">Tap in the right order. Tap again to start over.</p><ol className="live-order">{q.options!.map((o, k) => { const pos = sel.indexOf(k); return <li key={k}><button className={`live-opt o${k % 4}${pos >= 0 ? ' on' : ''}`} onClick={() => { const n = pos >= 0 ? [] : [...sel, k]; save(n.length === q.options!.length ? n : null); setMine((m) => m.map((x, kk) => (kk === i ? (n.length === q.options!.length ? n : n.length ? n : null) : x))); }}><span className="shape">{pos >= 0 ? pos + 1 : '·'}</span>{o}</button></li>; })}</ol></>}
      <div className="live-nav"><button className="btn" disabled={i === 0} onClick={() => { if (q.type === 'text') save(text.trim() ? [text.trim()] : null); setI(i - 1); }}>← Back</button><span className="muted">{answeredCount}/{ex.questions.length} answered</span>{i < ex.questions.length - 1 ? <button className="btn primary" onClick={() => { if (q.type === 'text') save(text.trim() ? [text.trim()] : null); setI(i + 1); }}>Next →</button> : <button className="btn primary" disabled={busy} onClick={submit}>Hand in</button>}</div>
      <p className="muted small" style={{ textAlign: 'center' }}>Your answers are saved as you go. {i < ex.questions.length - 1 && <button className="linklike" onClick={submit}>Hand in now</button>}</p>
    </div>
  );
}

const STAGES = ['Foundation', 'Walls', 'Arches', 'Windows', 'Tower', 'Spire'];
/** A cathedral that grows as the class gets answers right. */
function Cathedral({ done, goal }: { done: number; goal: number }) {
  const f = Math.min(1, done / Math.max(1, goal));
  const stage = Math.min(STAGES.length - 1, Math.floor(f * STAGES.length));
  const rows = 12, lit = Math.round(f * rows);
  return (
    <figure className="cathedral" aria-label={`Cathedral ${Math.round(f * 100)} percent built`}>
      <div className="cath-art" aria-hidden="true">{Array.from({ length: rows }, (_, i) => <i key={i} className={i < lit ? 'on' : ''} style={{ width: `${30 + Math.min(i, rows - 1 - i) * 5 + (i === rows - 1 ? -8 : 0)}%` }} />).reverse()}{f >= 1 && <span className="cath-cross">✝</span>}</div>
      <figcaption><strong>{STAGES[stage]}</strong> · {done} of {goal} stones</figcaption>
    </figure>
  );
}

/** The teacher's screen for a race or a build: the road or the cathedral, and who is ahead. */
function RunHost({ v, now, onEnd }: { v: LiveView; now: () => number; onEnd: () => void }) {
  const r = v.run!;
  const left = useCountdown(r.deadline, now);
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div className="live-center" style={{ maxWidth: 900 }}>
      <div className="live-clock" role="timer">⏳ {mm(left)}</div>
      {v.settings.mode === 'build' ? <Cathedral done={r.classSteps} goal={r.classGoal} /> : (
        <ol className="road" aria-label="The road">{r.track.slice(0, 14).map((t) => <li key={t.id}><span className="who">{t.name}</span><span className="lane"><i style={{ left: `${Math.min(100, (t.steps / r.goal) * 100)}%` }}>🚶</i><b aria-hidden="true">⛪</b></span><span className="n">{t.steps}/{r.goal}{t.finished ? ' 🏁' : t.streak >= 3 ? ' 🔥' : ''}</span></li>)}</ol>
      )}
      {v.settings.mode === 'build' && <ol className="live-board">{r.track.slice(0, 5).map((t, k) => <li key={t.id}><span className="rank">{k + 1}</span><span className="nm">{t.name}</span><span className="pts">{t.steps} stones</span></li>)}</ol>}
      <button className="btn" onClick={() => confirm('End the game now?') && onEnd()}>End now</button>
    </div>
  );
}

/** A student's side of a race or a build: question after question at their own pace. */
function RunPlay({ v, link, now }: { v: LiveView; link: PlayerLink; now: () => number }) {
  const r = v.run!, mine = r.mine;
  const left = useCountdown(r.deadline, now);
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const [sel, setSel] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const q = mine?.question;
  const fb = mine?.feedback;
  const key = `${mine?.steps}:${fb?.n}`;
  useEffect(() => { setSel([]); setText(''); setBusy(false); }, [key]);
  const send = async (val: unknown) => { setBusy(true); try { await link.answer(val); } catch { setBusy(false); } };
  const doneRace = v.settings.mode === 'race' && (mine?.steps ?? 0) >= r.goal;
  return (
    <div>
      <div className="live-clock" role="timer">⏳ {mm(left)}</div>
      {v.settings.mode === 'build' ? <Cathedral done={r.classSteps} goal={r.classGoal} /> : <div className="road mine" aria-label={`You have taken ${mine?.steps ?? 0} of ${r.goal} steps`}><span className="lane"><i style={{ left: `${Math.min(100, ((mine?.steps ?? 0) / r.goal) * 100)}%` }}>🚶</i><b aria-hidden="true">⛪</b></span><span className="n">{mine?.steps ?? 0}/{r.goal}{(mine?.streak ?? 0) >= 3 ? ` · 🔥 ${mine!.streak}` : ''}</span></div>}
      {fb && <div className={`run-fb ${fb.ok ? 'ok' : 'no'}`} role="status" key={fb.n}><strong>{fb.ok ? (v.settings.mode === 'build' ? '✓ A stone is laid!' : '✓ A step forward!') : '✗ Not quite.'}</strong>{!fb.ok && <> Right answer: <em>{fb.correct.map((c) => (fb.options ? fb.options[Number(c)] : String(c))).join(', ')}</em>.</>}{fb.why && <span className="muted"> {fb.why}</span>}</div>}
      {doneRace && <div className="live-center"><h1>🏁 You reached the church!</h1><p className="muted">Wait for the others to finish.</p></div>}
      {q && !doneRace && (
        <>
          <h2 className="live-q">{q.q}</h2>
          {(q.type === 'mc' || q.type === 'tf') && <div className={`live-opts n${q.options!.length}`}>{q.options!.map((o, i) => <button key={i} disabled={busy} className={`live-opt o${i % 4}`} onClick={() => send(i)}><span className="shape" aria-hidden="true">{SHAPES[i]}</span>{o}</button>)}</div>}
          {q.type === 'multi' && <><p className="muted small">Choose all that apply.</p><div className="live-opts n4">{q.options!.map((o, i) => <button key={i} className={`live-opt o${i % 4}${sel.includes(i) ? ' on' : ''}`} aria-pressed={sel.includes(i)} onClick={() => setSel(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])}><span className="shape" aria-hidden="true">{sel.includes(i) ? '✓' : SHAPES[i]}</span>{o}</button>)}</div><button className="btn primary big" disabled={!sel.length || busy} onClick={() => send(sel)}>Lock in</button></>}
          {q.type === 'text' && <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) void send([text.trim()]); }} className="live-form"><input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="Type your answer" aria-label="Your answer" autoFocus /><button className="btn primary big" disabled={!text.trim() || busy}>Lock in</button></form>}
          {q.type === 'order' && <><p className="muted small">Tap in the right order.</p><ol className="live-order">{q.options!.map((o, i) => <li key={i}><button className={`live-opt o${i % 4}${sel.includes(i) ? ' on' : ''}`} onClick={() => setSel(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])}><span className="shape">{sel.includes(i) ? sel.indexOf(i) + 1 : '·'}</span>{o}</button></li>)}</ol><div className="row" style={{ gap: 8 }}><button className="btn" onClick={() => setSel([])}>Clear</button><button className="btn primary big" disabled={sel.length !== q.options!.length || busy} onClick={() => send(sel)}>Lock in</button></div></>}
        </>
      )}
    </div>
  );
}

/** A student's vote on a poll slide. */
function PollVote({ v, onVote }: { v: LiveView; onVote: (i: number) => void }) {
  const opts = v.slides![v.slideIndex].poll!.options;
  return (
    <div className="live-opts n4" role="group" aria-label="Vote">
      {opts.map((o, i) => <button key={o} className={`live-opt o${i % 4}${v.poll!.mine === i ? ' on' : ''}`} aria-pressed={v.poll!.mine === i} onClick={() => onVote(i)}><span className="shape" aria-hidden="true">{v.poll!.mine === i ? '✓' : SHAPES[i]}</span>{o}</button>)}
      {v.poll!.mine !== undefined && <p className="muted small" style={{ gridColumn: '1 / -1' }}>Your vote is counted. You can change it until your teacher moves on.</p>}
    </div>
  );
}
/** The teacher's live count of a poll. */
function PollBars({ v }: { v: LiveView }) {
  const opts = v.slides![v.slideIndex].poll!.options, c = v.poll!.counts, max = Math.max(1, ...c);
  return (
    <div>
      <ul className="live-bars">{opts.map((o, i) => <li key={o}><span className="lab">{SHAPES[i]}  {o}</span><span className="bar"><i className={`o${i % 4}`} style={{ width: `${(c[i] / max) * 100}%` }} /></span><span className="n">{c[i]}</span></li>)}</ul>
      <p className="muted small" style={{ textAlign: 'center' }}>{v.poll!.total} of {v.players.length} have voted</p>
    </div>
  );
}
