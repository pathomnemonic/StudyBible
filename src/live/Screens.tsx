import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { live, randomName, useCountdown, useLive } from './client';
import type { LiveSlide, LiveView } from './types';
import InlinePlayer from '../components/InlinePlayer';
import { embedFor } from '../lib/embed';

const SHAPES = ['▲', '◆', '●', '■'];
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
  return (
    <div className="live-timer" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <div className="live-timer-bar"><i style={{ width: `${Math.min(100, (left / total) * 100)}%` }} /></div>
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
  useEffect(() => { if (/^\d{6}$/.test(code)) live.peek(code).then((p) => setTitle(p.title), () => setTitle('')); else setTitle(''); }, [code]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const c = code.replace(/\D/g, '');
      const j = await live.join(c, name.trim() || randomName(), read(tokOf(c)) || undefined);
      write(tokOf(c), j.token); write('sb:live:name', name.trim());
      nav(`/play/${c}`);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="page live-join">
      <h1>Join a class</h1>
      <p className="lede">Type the number your teacher is showing.</p>
      <form onSubmit={submit} className="live-form">
        <label>Class code<input inputMode="numeric" autoComplete="off" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" aria-label="Class code" className="live-code-input" autoFocus /></label>
        {title && <p className="muted small">Session: <strong>{title}</strong></p>}
        <label>Your name<div className="row" style={{ gap: 6 }}><input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="A name your class will know" style={{ flex: 1 }} /><button type="button" className="btn small" onClick={() => setName(randomName())}>🎲 Surprise me</button></div></label>
        {err && <div className="notice warn" role="alert">{err}</div>}
        <button className="btn primary big" disabled={busy || code.length !== 6}>{busy ? 'Joining…' : 'Join'}</button>
      </form>
    </div>
  );
}

export function PlayPage() {
  const { code = '' } = useParams();
  const token = read(tokOf(code));
  const { view: v, state, serverNow } = useLive(code, { token });
  const [sel, setSel] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const qKey = `${v?.qIndex}:${v?.phase === 'question'}`;
  useEffect(() => { setSel([]); setText(''); setSent(false); }, [qKey]);
  if (!token) return <div className="page"><p>You have not joined this class yet.</p><Link className="btn primary" to={`/join/${code}`}>Join</Link></div>;
  if (state === 'gone') return <div className="page"><h1>This session has ended</h1><p className="muted">The teacher closed it, or it timed out.</p><Link className="btn" to="/join">Join another</Link></div>;
  if (!v) return <div className="page"><p className="muted" aria-busy="true">Connecting…</p></div>;
  const me = v.me;
  const q = v.question;
  const send = async (value: unknown) => { setSent(true); try { await live.answer(code, token, value); } catch { setSent(false); } };
  const answered = sent || me?.answered;
  const toggle = (i: number) => setSel((s) => (q?.type === 'order' ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <div className="page live-play" aria-live="polite">
      <header className="live-top"><span className="live-who">{me?.name}</span><span>{me?.score.toLocaleString()} pts</span>{v.settings.teams > 0 && me?.team !== undefined && <span className={`live-chip t${me.team}`}>{['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Orange'][me.team]} team</span>}{state === 'lost' && <span className="live-chip warn">Reconnecting…</span>}</header>
      {v.phase === 'lobby' && <div className="live-center"><h1>You’re in!</h1><p className="lede">{v.title}</p><p className="muted">Waiting for your teacher to start. Look at the big screen.</p><div className="live-bounce" aria-hidden="true">✝</div></div>}
      {v.phase === 'slides' && v.slides && <div><SlideView s={v.slides[v.slideIndex]} /><p className="muted small" style={{ textAlign: 'center' }}>Slide {v.slideIndex + 1} of {v.slideCount} · your teacher is moving through the lesson</p></div>}
      {v.phase === 'question' && q && (
        <div>
          <Timer deadline={q.deadline} total={q.time} now={serverNow} />
          <p className="muted small">Question {v.qIndex + 1} of {v.qCount}{q.points === 2 ? ' · double points' : q.points === 0 ? ' · no points' : ''}</p>
          <h2 className="live-q">{q.q}</h2>
          {answered ? <div className="live-center"><h3>Answer locked in</h3><p className="muted">Waiting for the others… {q.answered}/{q.total} answered</p></div> : (
            <>
              {(q.type === 'mc' || q.type === 'tf') && <div className={`live-opts n${q.options!.length}`}>{q.options!.map((o, i) => <button key={i} className={`live-opt o${i}`} onClick={() => send(i)}><span className="shape" aria-hidden="true">{SHAPES[i]}</span>{o}</button>)}</div>}
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
          {me.last?.correct && <p className="live-gain">+{(me.last.points + me.last.bonus).toLocaleString()}{me.last.bonus ? ` (streak bonus ${me.last.bonus})` : ''}</p>}
          {!me.last?.correct && v.reveal && <p>Right answer: <strong>{v.reveal.correct.map((c) => (q.options ? q.options[Number(c)] : String(c))).join(q.type === 'order' ? ' → ' : ', ')}</strong></p>}
          {v.reveal?.why && <p className="muted">{v.reveal.why}</p>}
          <p className="live-rank">You are {ordinal(me.rank)} · {me.score.toLocaleString()} points{me.streak >= 2 ? ` · 🔥 ${me.streak} in a row` : ''}</p>
        </div>
      )}
      {v.phase === 'board' && <Board v={v} me={me?.id} />}
      {v.phase === 'ended' && me && (
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
  const key = read(keyOf(code));
  const { view: v, state, serverNow } = useLive(code, { key });
  const act = (a: string, arg?: unknown) => live.host(code, key, a, arg).catch(() => undefined);
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
  if (!key) return <div className="page"><p>This session was started on another device. Open it there, or start a new one.</p><Link className="btn" to="/study/curriculum">Lessons</Link></div>;
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
        {state === 'lost' && <span className="live-chip warn">Reconnecting…</span>}
        <button className="btn small" onClick={() => confirm('End this session for everyone?') && act('end')} disabled={v.phase === 'ended'}>End</button>
      </header>

      {v.phase === 'lobby' && (
        <div className="live-center">
          <p className="muted">Go to <strong>{location.host}</strong> and choose <strong>Join a class</strong>, or open</p>
          <p className="live-url">{joinUrl}</p>
          <p className="muted">and enter the code</p>
          <div className="live-code" aria-label={`Class code ${v.code.split('').join(' ')}`}>{v.code}</div>
          <div className="row" style={{ gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
            <button className="btn primary big" onClick={() => act('start')} disabled={!v.slideCount && !v.qCount}>{v.slideCount ? 'Start the lesson' : 'Start the quiz'}</button>
            {v.slideCount > 0 && v.qCount > 0 && <button className="btn" onClick={() => act('quiz')}>Skip to the quiz</button>}
            <button className="btn" aria-pressed={v.locked} onClick={() => act('lock', !v.locked)}>{v.locked ? '🔒 Locked' : '🔓 Lock the room'}</button>
          </div>
          <p className="muted small">{v.slideCount} slides · {v.qCount} questions{v.settings.teams ? ` · ${v.settings.teams} teams` : ''}</p>
          <ul className="live-players">{v.players.map((p) => <li key={p.id} className={p.connected ? '' : 'off'}>{p.name}{v.settings.teams ? ` · ${['Red', 'Blue', 'Gold', 'Green', 'Purple', 'Orange'][p.team ?? 0]}` : ''} <button className="icon-btn" aria-label={`Remove ${p.name}`} onClick={() => act('kick', p.id)}>✕</button></li>)}{!v.players.length && <li className="muted">Waiting for students…</li>}</ul>
        </div>
      )}

      {v.phase === 'slides' && v.slides && (
        <div>
          <SlideView s={v.slides[v.slideIndex]} />
          <div className="live-nav">
            <button className="btn" disabled={v.slideIndex === 0} onClick={() => act('slide', v.slideIndex - 1)}>← Back</button>
            <span>{v.slideIndex + 1} / {v.slideCount} · {connected} watching</span>
            {v.slideIndex < v.slideCount - 1 ? <button className="btn primary" onClick={() => act('slide', v.slideIndex + 1)}>Next →</button> : <button className="btn primary" onClick={() => act('quiz')} disabled={!v.qCount}>{v.qCount ? 'Start the quiz →' : 'Done'}</button>}
            {v.qCount > 0 && v.slideIndex < v.slideCount - 1 && <button className="btn small" onClick={() => act('quiz')}>Skip to quiz</button>}
          </div>
        </div>
      )}

      {v.phase === 'question' && q && (
        <div>
          <Timer deadline={q.deadline} total={q.time} now={serverNow} />
          <p className="muted">Question {v.qIndex + 1} of {v.qCount} · {q.answered}/{q.total} answered{q.points === 2 ? ' · double points' : ''}</p>
          <h2 className="live-q big">{q.q}</h2>
          {q.options && <div className={`live-opts n${q.options.length}`}>{q.options.map((o, i) => <div key={i} className={`live-opt o${i % 4} static`}><span className="shape" aria-hidden="true">{q.type === 'order' ? '·' : SHAPES[i % 4]}</span>{o}</div>)}</div>}
          {q.type === 'text' && <p className="muted">Students type their answer.</p>}
          {q.type === 'multi' && <p className="muted">Select all that apply.</p>}
          {q.type === 'order' && <p className="muted">Students put these in order.</p>}
          <div className="live-nav"><button className="btn" onClick={() => act('skip')}>Show the answer now</button></div>
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
          <h1>🎉 Final results</h1>
          <div className="live-podium">{[1, 0, 2].map((i) => v.board[i] && <div key={i} className={`step s${i + 1}`}><span className="medal">{['🥇', '🥈', '🥉'][i]}</span><strong>{v.board[i].name}</strong><span>{v.board[i].score.toLocaleString()}</span></div>)}</div>
          <Board v={v} /><Teams v={v} />
          <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
            <a className="btn primary" href={live.exportUrl(code, key)} download>Download scores (CSV)</a>
            <Link className="btn" to="/study/curriculum">Back to lessons</Link>
          </div>
          <p className="muted small">The session stays open for a little while so you can download the scores.</p>
        </div>
      )}
    </div>
  );
}
