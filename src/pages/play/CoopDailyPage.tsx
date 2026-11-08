import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { THEMED } from '../../data/cloister';
import { ANSWERS } from '../../data/verbum';
import { dailyDone, dayIndex, markDailyDone } from '../../lib/dailyGame';
import { copyText } from '../../lib/clipboard';
import { buzz } from '../../lib/haptics';
import { cleanName, colourFor, nameProblem } from '../../lib/coop/names';
import { board as rowsOf, finished, solved } from '../../lib/coop/merge';
import { joinRoom, newRoomCode, type CoopRoom } from '../../lib/coop/room';
import { verbumAnswer } from '../../lib/coop/words';
import { mark } from './VerbumPage';

const ROWS = 6, LEN = 5;
const KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NAME = 'sb:coop:name';
const getName = () => { try { return localStorage.getItem(NAME) ?? ''; } catch { return ''; } };

/** Today's Verbum, solved together: share a six-digit code, and every guess anyone makes appears for everyone. */
export default function CoopDailyPage() {
  const [sp, setSp] = useSearchParams();
  const code = (sp.get('room') ?? '').replace(/\D/g, '').slice(0, 6);
  const [name, setName] = useState(getName);
  const [joinCode, setJoinCode] = useState('');
  const [err, setErr] = useState('');
  const go = (c: string) => {
    const p = nameProblem(name);
    if (p) { setErr(p); return; }
    if (!/^\d{6}$/.test(c)) { setErr('A room code is six digits.'); return; }
    try { localStorage.setItem(NAME, cleanName(name)); } catch { /* private mode */ }
    setErr(''); setSp({ room: c });
  };
  if (/^\d{6}$/.test(code) && !nameProblem(name)) return <Room key={code} code={code} name={cleanName(name)} leave={() => setSp({})} />;
  return (
    <div className="page cp">
      <h1>Solve Verbum together</h1>
      <p className="muted">Today’s word, one shared board. Everyone in the room can type guesses, and every guess shows for everyone, with the colour of the person who made it. Six tries between you, as in the solo game.</p>
      <div className="card cp-card">
        <label className="field">Your name (a nickname is fine)
          <input value={name} maxLength={20} autoComplete="nickname" onChange={(e) => setName(e.target.value)} placeholder="For example, Mum" />
        </label>
        <button className="btn primary big" onClick={() => go(newRoomCode())}>Start a room</button>
        <p className="muted small">You get a six-digit code. Send it, or the link, to the others. Anyone can open a room; nobody is the host.</p>
        <hr />
        <label className="field">Join with a code
          <input inputMode="numeric" value={joinCode} maxLength={6} onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))} placeholder="Six digits" aria-label="Room code" />
        </label>
        <button className="btn" onClick={() => go(joinCode)}>Join</button>
        {err && <p className="cp-err" role="alert">{err}</p>}
      </div>
      <p className="muted small">No account. Guesses travel between your devices through public message relays, sealed with a key made from the code, so the relays cannot read them. Anyone who knows the code can join the room. The room starts afresh each day.</p>
      <p><Link className="btn ghost" to="/play">All games</Link></p>
    </div>
  );
}

function Room({ code, name, leave }: { code: string; name: string; leave: () => void }) {
  const day = useMemo(dayIndex, []);
  const answer = verbumAnswer(day);
  const [valid, setValid] = useState<Set<string> | null>(null);
  const [room, setRoom] = useState<CoopRoom | null>(null);
  const [fail, setFail] = useState('');
  const [, bump] = useState(0);
  const [cur, setCur] = useState('');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const counted = useRef(false);
  useEffect(() => { getJson<{ words: string[] }>('play/words.json', true).then((d) => setValid(new Set([...(d?.words ?? []).filter((w) => w.length === LEN), ...THEMED, ...ANSWERS].filter((w) => w.length === LEN)))); }, []);
  useEffect(() => {
    let r: CoopRoom | null = null, off = () => undefined as void, gone = false;
    joinRoom(code, name, day, answer, ROWS).then((x) => { if (gone) { x.close(); return; } r = x; setRoom(x); off = x.subscribe(() => bump((n) => n + 1)); }, (e: Error) => setFail(e.message));
    const t = setInterval(() => bump((n) => n + 1), 5000); // let members who went quiet drop out of the list
    return () => { gone = true; clearInterval(t); off(); r?.close(); };
  }, [code, name, day, answer]);

  const rows = rowsOf(room?.guesses() ?? [], answer, ROWS);
  const won = solved(rows, answer);
  const over = finished(rows, answer, ROWS);
  useEffect(() => {
    if (!over || counted.current) return;
    counted.current = true;
    if (dailyDone('verbum') === null) markDailyDone('verbum', won ? `${rows.length}/${ROWS}` : 'missed', won && rows.length <= 3);
    buzz(won ? 30 : 10);
  }, [over, won, rows.length]);

  const submit = useCallback(() => {
    if (!room || over) return;
    if (cur.length < LEN) { setMsg('Five letters'); return; }
    if (valid && !valid.has(cur)) { setMsg('Not in the word list'); buzz(8); return; }
    if (rows.some((g) => g.w === cur)) { setMsg('Already tried'); return; }
    setMsg(''); setCur(''); room.guess(cur);
  }, [room, over, cur, valid, rows]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (over || e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input,textarea')) return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') setCur((c) => c.slice(0, -1));
      else if (/^[a-z]$/i.test(e.key)) setCur((c) => (c.length < LEN ? c + e.key.toLowerCase() : c));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [over, submit]);
  const press = (k: string) => { if (over) return; if (k === '⏎') submit(); else if (k === '⌫') setCur((c) => c.slice(0, -1)); else setCur((c) => (c.length < LEN ? c + k : c)); };
  const keyState = useMemo(() => {
    const m: Record<string, string> = {}; const rank: Record<string, number> = { miss: 0, near: 1, hit: 2 };
    for (const g of rows) mark(g.w, answer).forEach((k, i) => { if (m[g.w[i]] === undefined || rank[k] > rank[m[g.w[i]]]) m[g.w[i]] = k; });
    return m;
  }, [rows, answer]);
  const link = `${location.origin}${location.pathname}#/play/coop?room=${code}`;
  const members = room?.members() ?? [];
  const state = room?.state();
  const cells = Array.from({ length: ROWS }, (_, r) => (r < rows.length ? rows[r] : null));

  if (fail) return <div className="page cp"><h1>Together</h1><p className="cp-err">{fail}</p><button className="btn" onClick={leave}>Back</button></div>;
  return (
    <div className="page cp">
      <h1>Verbum together</h1>
      <div className="cp-top">
        <div>Room <b className="cp-code" aria-label="Room code">{code}</b></div>
        <button className="btn small" onClick={() => { void copyText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>{copied ? 'Link copied' : 'Copy invite link'}</button>
        <button className="btn ghost small" onClick={() => { room?.leave(); leave(); }}>Leave</button>
      </div>
      <ul className="cp-who" aria-label="In the room">
        {members.map((m) => <li key={m.id} className="chip" style={{ borderColor: colourFor(m.name) }}><span className="cp-dot" style={{ background: colourFor(m.name) }} />{m.name}{m.id === room?.id ? ' (you)' : ''}</li>)}
        {!room && <li className="muted small">Connecting…</li>}
      </ul>
      {state && state !== 'open' && <p className="muted small" role="status">Reconnecting to the relay…</p>}
      <div className="cp-grid" role="grid" aria-label="Shared guesses">
        {cells.map((g, r) => {
          const ms = g ? mark(g.w, answer) : [];
          const typing = !g && r === rows.length && !over ? cur : '';
          return (
            <div className="cp-row" role="row" key={r}>
              {Array.from({ length: LEN }, (_, i) => <span role="gridcell" key={i} className={`vb-cell cp-cell ${g ? ms[i] : typing[i] ? 'typed' : ''}`} style={g ? { boxShadow: `0 3px 0 ${colourFor(g.name)}` } : undefined}>{g ? g.w[i] : typing[i] ?? ''}</span>)}
              <span className="cp-by" style={{ color: g ? colourFor(g.name) : undefined }}>{g ? g.name : ''}</span>
            </div>
          );
        })}
      </div>
      <p className="vb-msg" aria-live="polite">
        {msg || (over ? (won ? `Solved together in ${rows.length} ${rows.length === 1 ? 'guess' : 'guesses'}: ${answer.toUpperCase()}.` : `Not this time. The word was ${answer.toUpperCase()}.`) : `${ROWS - rows.length} ${ROWS - rows.length === 1 ? 'guess' : 'guesses'} left between you`)}
      </p>
      {over ? (
        <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
          <Link className="btn" to="/play/leaderboard">Group leaderboard</Link>
          <button className="btn ghost" onClick={() => { room?.leave(); leave(); }}>Leave the room</button>
        </div>
      ) : (
        <div className="vb-keys">
          {KEYS.map((row, i) => (
            <div className="vb-keyrow" key={row}>
              {i === 2 && <button className="vb-key wide" onClick={() => press('⏎')} aria-label="Enter">⏎</button>}
              {[...row].map((k) => <button key={k} className={`vb-key ${keyState[k] ?? ''}`} onClick={() => press(k)}>{k}</button>)}
              {i === 2 && <button className="vb-key wide" onClick={() => press('⌫')} aria-label="Delete">⌫</button>}
            </div>
          ))}
        </div>
      )}
      <p className="muted small" style={{ textAlign: 'center' }}>Guesses are sealed with a key made from the code. Anyone who knows the code can join. Solving together counts as today’s Verbum.</p>
    </div>
  );
}
