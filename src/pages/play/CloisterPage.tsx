import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { THEMED } from '../../data/cloister';
import ShareButton from '../../components/ShareButton';
import { buzz } from '../../lib/haptics';

const N = 5, TIME = 180;
const DICE = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXZ';
const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const rng = (seed: number) => { let s = seed * 2654435761 % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; };
const makeBoard = (seed: number) => { const r = rng(seed + 1); return Array.from({ length: N * N }, () => DICE[Math.floor(r() * DICE.length)]); };
const adj = (a: number, b: number) => a !== b && Math.abs((a % N) - (b % N)) <= 1 && Math.abs(Math.floor(a / N) - Math.floor(b / N)) <= 1;
const pts = (w: string) => (w.length <= 3 ? 1 : w.length === 4 ? 2 : w.length === 5 ? 4 : w.length === 6 ? 6 : 10);
const score = (w: string) => pts(w) + (THEMED.has(w) ? 5 + pts(w) : 0);
const bestKey = (daily: boolean) => `sb:cloister:best:${daily ? 'daily' : 'any'}`;
const loadBest = (daily: boolean) => { try { return +(localStorage.getItem(bestKey(daily)) ?? 0); } catch { return 0; } };

/** All the words a board holds, found by walking neighbouring letters through the prefixes of the word list. */
function solve(board: string[], words: Set<string>, prefixes: Set<string>): Set<string> {
  const found = new Set<string>();
  const walk = (i: number, path: number[], s: string) => {
    s += board[i].toLowerCase();
    if (!prefixes.has(s)) return;
    if (s.length >= 3 && words.has(s)) found.add(s);
    if (s.length >= 10) return;
    for (let j = 0; j < N * N; j++) if (!path.includes(j) && adj(i, j)) walk(j, [...path, j], s);
  };
  for (let i = 0; i < N * N; i++) walk(i, [i], '');
  return found;
}

/** A board of letters. Link neighbouring letters to spell words; every word scores, and the words of the faith score more. */
export default function CloisterPage() {
  const [dict, setDict] = useState<{ words: Set<string>; prefixes: Set<string> } | null>(null);
  const [daily, setDaily] = useState(true);
  const [seed, setSeed] = useState(dayIndex());
  const [phase, setPhase] = useState<'start' | 'play' | 'done'>('start');
  const board = useMemo(() => makeBoard(seed), [seed]);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [left, setLeft] = useState(TIME);
  const drag = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    getJson<{ words: string[] }>('play/words.json', true).then((d) => {
      const words = new Set<string>([...(d?.words ?? []), ...THEMED]);
      const prefixes = new Set<string>();
      for (const w of words) for (let i = 1; i <= w.length; i++) prefixes.add(w.slice(0, i));
      setDict({ words, prefixes });
    });
  }, []);
  const possible = useMemo(() => (dict ? solve(board, dict.words, dict.prefixes) : new Set<string>()), [dict, board]);
  const total = found.reduce((a, w) => a + score(w), 0);
  const word = path.map((i) => board[i]).join('').toLowerCase();

  const begin = (isDaily: boolean) => { const s = isDaily ? dayIndex() : Math.floor(Math.random() * 1e6); setDaily(isDaily); setSeed(s); setFound([]); setPath([]); setLeft(TIME); setMsg(''); setPhase('play'); };
  useEffect(() => {
    if (phase !== 'play') return;
    const t = window.setInterval(() => setLeft((l) => { if (l <= 1) { window.clearInterval(t); setPhase('done'); return 0; } return l - 1; }), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  useEffect(() => { if (phase === 'done') { try { if (total > loadBest(daily)) localStorage.setItem(bestKey(daily), String(total)); } catch { /* private mode */ } } }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((i: number) => setPath((p) => {
    if (p.includes(i)) return p.length > 1 && p[p.length - 2] === i ? p.slice(0, -1) : p;
    if (p.length && !adj(p[p.length - 1], i)) return [i];
    return [...p, i];
  }), []);
  const submit = useCallback(() => {
    if (word.length < 3) { setPath([]); return; }
    if (found.includes(word)) setMsg('Already found');
    else if (dict?.words.has(word)) { setFound((f) => [word, ...f]); setMsg(THEMED.has(word) ? `${word}: bonus! +${score(word)}` : `${word} +${score(word)}`); buzz(THEMED.has(word) ? 30 : 12); }
    else setMsg('Not a word');
    setPath([]);
  }, [word, found, dict]);
  const cellAt = (x: number, y: number) => { const el = document.elementFromPoint(x, y) as HTMLElement | null; const i = el?.closest('[data-cell]')?.getAttribute('data-cell'); return i == null ? null : +i; };
  const best = loadBest(daily);

  if (phase === 'start') {
    return (
      <div className="page cloister">
        <h1>Cloister</h1>
        <p className="muted">Link neighbouring letters to spell words, in any direction. Words of the faith (saint, psalm, altar…) earn a bonus. Three minutes.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary big" disabled={!dict} onClick={() => begin(true)}>{dict ? 'Today’s board' : 'Loading words…'}</button>
          <button className="btn big" disabled={!dict} onClick={() => begin(false)}>A new board</button>
        </div>
        <p className="muted small">Best today’s board: {loadBest(true)} · Best any board: {loadBest(false)}</p>
        <p><Link className="btn ghost" to="/play">All games</Link></p>
      </div>
    );
  }
  return (
    <div className="page cloister">
      <div className="cl-top"><span>{daily ? 'Today’s board' : 'New board'}</span><strong>{total}</strong><span className={left <= 15 ? 'low' : ''}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span></div>
      <div className="cl-word" aria-live="polite">{phase === 'play' ? (word ? word.toUpperCase() : msg || 'Link letters') : `Time. ${found.length} words, ${total} points`}</div>
      <div ref={gridRef} className="cl-grid" role="group" aria-label="Letters"
        onPointerDown={(e) => { if (phase !== 'play') return; drag.current = true; const i = cellAt(e.clientX, e.clientY); if (i != null) setPath([i]); }}
        onPointerMove={(e) => { if (!drag.current) return; const i = cellAt(e.clientX, e.clientY); if (i != null) add(i); }}
        onPointerUp={() => { if (!drag.current) return; drag.current = false; if (path.length > 1) submit(); }}
        onPointerCancel={() => { drag.current = false; setPath([]); }}>
        {board.map((c, i) => <button key={i} data-cell={i} className={`cl-cell${path.includes(i) ? ' on' : ''}${path[path.length - 1] === i ? ' last' : ''}`} onClick={() => { if (phase === 'play' && !drag.current) add(i); }} aria-label={c}>{c}</button>)}
      </div>
      {phase === 'play' && (
        <div className="row" style={{ gap: 8, justifyContent: 'center', margin: '8px 0' }}>
          <button className="btn" onClick={() => setPath([])} disabled={!path.length}>Clear</button>
          <button className="btn primary" onClick={submit} disabled={word.length < 3}>Add word</button>
        </div>
      )}
      <p className="muted small" style={{ textAlign: 'center' }}>{found.length} of about {possible.size} words · best {Math.max(best, phase === 'done' ? total : 0)}</p>
      <div className="cl-found">{found.map((w) => <span key={w} className={`chip${THEMED.has(w) ? ' sel' : ''}`}>{w}</span>)}</div>
      {phase === 'done' && (
        <>
          <h2 className="eyebrow-h">Words you missed</h2>
          <div className="cl-found">{[...possible].filter((w) => !found.includes(w)).sort((a, b) => score(b) - score(a)).slice(0, 24).map((w) => <span key={w} className={`chip${THEMED.has(w) ? ' sel' : ''}`}>{w}</span>)}</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <ShareButton text={`Cloister ${daily ? '#' + seed : 'practice'} 🔤 ${total} points\n${found.length} of ${possible.size} words · ${found.filter((w) => THEMED.has(w)).length} of the faith ✝️\n${'🟨'.repeat(Math.min(10, Math.round((found.length / Math.max(1, possible.size)) * 10)))}${'⬜'.repeat(10 - Math.min(10, Math.round((found.length / Math.max(1, possible.size)) * 10)))}`} path="/play/cloister" />
            <button className="btn" onClick={() => begin(false)}>A new board</button>
            <button className="btn" onClick={() => setPhase('start')}>Back</button>
          </div>
        </>
      )}
    </div>
  );
}
