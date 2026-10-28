import { useEffect, useMemo, useRef, useState } from 'react';
import { CROSSWORDS, type Crossword } from '../../data/crosswords';
import ShareButton from '../../components/ShareButton';
import { dayIndex } from '../../lib/dailyGame';

const weekNo = () => Math.floor((dayIndex() + 3) / 7);
const SAVE = 'sb:crossword:v1';
interface Saved { week: number; fill: Record<string, string>; done?: boolean }
const load = (): Saved | null => { try { return JSON.parse(localStorage.getItem(SAVE) ?? 'null') as Saved | null; } catch { return null; } };

/** Cell numbers and the cells of each word. */
export function layout(p: Crossword) {
  const start = new Map<string, number>();
  let n = 0;
  const sorted = [...p.words].sort((a, b) => a.r - b.r || a.c - b.c);
  for (const w of sorted) { const k = `${w.r},${w.c}`; if (!start.has(k)) start.set(k, ++n); }
  const cells = new Map<string, string>();
  for (const w of p.words) for (let i = 0; i < w.w.length; i++) cells.set(w.d === 'a' ? `${w.r},${w.c + i}` : `${w.r + i},${w.c}`, w.w[i]);
  return { start, cells, num: (w: Crossword['words'][number]) => start.get(`${w.r},${w.c}`)! };
}
const cellsOf = (w: Crossword['words'][number]) => [...w.w].map((_, i) => (w.d === 'a' ? `${w.r},${w.c + i}` : `${w.r + i},${w.c}`));

/** A small crossword of the faith, a new one each week. Tap a square, type, and use Check when you are stuck. */
export default function CrosswordPage() {
  const [idx, setIdx] = useState(weekNo() % CROSSWORDS.length);
  const weekly = idx === weekNo() % CROSSWORDS.length;
  const p = CROSSWORDS[idx];
  const L = useMemo(() => layout(p), [p]);
  const [fill, setFill] = useState<Record<string, string>>(() => { const s = load(); return s && s.week === weekNo() && idx === weekNo() % CROSSWORDS.length ? s.fill : {}; });
  const [sel, setSel] = useState<string | null>(null);
  const [dir, setDir] = useState<'a' | 'd'>('a');
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState(0);
  const started = useRef(Date.now());
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (weekly) try { localStorage.setItem(SAVE, JSON.stringify({ week: weekNo(), fill } satisfies Saved)); } catch { /* private mode */ } }, [fill, weekly]);
  const solved = [...L.cells].every(([k, ch]) => fill[k] === ch);
  const wordAt = (k: string, d: 'a' | 'd') => p.words.find((w) => w.d === d && cellsOf(w).includes(k));
  const active = sel ? wordAt(sel, dir) ?? wordAt(sel, dir === 'a' ? 'd' : 'a') : undefined;
  const activeCells = new Set(active ? cellsOf(active) : []);
  const tap = (k: string) => {
    if (sel === k) { const other = dir === 'a' ? 'd' : 'a'; if (wordAt(k, other)) setDir(other); }
    else { setSel(k); if (!wordAt(k, dir)) setDir(dir === 'a' ? 'd' : 'a'); }
    input.current?.focus();
  };
  const move = (k: string, step: 1 | -1) => {
    const w = wordAt(k, dir) ?? wordAt(k, dir === 'a' ? 'd' : 'a');
    if (!w) return;
    const cs = cellsOf(w), at = cs.indexOf(k) + step;
    if (at >= 0 && at < cs.length) setSel(cs[at]);
  };
  const type = (ch: string) => { if (!sel) return; setFill((f) => ({ ...f, [sel]: ch })); setChecked(false); setNote(''); move(sel, 1); };
  const back = () => { if (!sel) return; if (fill[sel]) setFill((f) => { const g = { ...f }; delete g[sel]; return g; }); else { move(sel, -1); } };
  const reveal = () => { if (!sel) { setNote('Tap a square first, then Reveal letter.'); return; } const ch = L.cells.get(sel); if (ch) { setFill((f) => ({ ...f, [sel]: ch })); setRevealed((r) => new Set(r).add(sel)); setNote(''); } };
  const check = () => {
    const all = [...L.cells.keys()];
    const wrong = all.filter((k) => fill[k] && fill[k] !== L.cells.get(k)).length;
    const empty = all.filter((k) => !fill[k]).length;
    setChecked(true); setChecks((c) => c + 1);
    setNote(wrong ? `${wrong} letter${wrong === 1 ? ' is' : 's are'} wrong, marked in red.` : empty ? `Everything so far is right. ${empty} square${empty === 1 ? '' : 's'} still empty.` : 'All correct!');
  };
  const mins = Math.max(1, Math.round((Date.now() - started.current) / 60000));
  const shareText = () => `Crossword, week ${weekNo()} ✏️ solved in about ${mins} min${revealed.size ? ` · ${revealed.size} letter${revealed.size === 1 ? '' : 's'} revealed` : ' · no reveals'}${checks ? ` · ${checks} check${checks === 1 ? '' : 's'}` : ''}\n` + Array.from({ length: p.rows }, (_, r) => Array.from({ length: p.cols }, (_, c) => { const k = `${r},${c}`; return !L.cells.has(k) ? '⬛' : revealed.has(k) ? '🟦' : '🟨'; }).join('')).join('\n');
  const across = p.words.filter((w) => w.d === 'a').sort((a, b) => L.num(a) - L.num(b));
  const down = p.words.filter((w) => w.d === 'd').sort((a, b) => L.num(a) - L.num(b));
  const clueRow = (w: Crossword['words'][number]) => <li key={`${w.d}${w.r}${w.c}`}><button className={`cw-clue${active === w ? ' on' : ''}`} onClick={() => { setSel(cellsOf(w)[0]); setDir(w.d); input.current?.focus(); }}><b>{L.num(w)}</b> {w.clue} <span className="muted">({w.w.length})</span></button></li>;

  return (
    <div className="page crossword">
      <h1>Crossword</h1>
      <p className="muted small">{weekly ? 'This week’s puzzle.' : 'A practice puzzle.'} Tap a square and type. Tap it again to switch between across and down.</p>
      <div className="cw-grid" style={{ gridTemplateColumns: `repeat(${p.cols}, 1fr)`, maxWidth: p.cols * 44 }} role="grid" aria-label="Crossword grid">
        {Array.from({ length: p.rows * p.cols }, (_, i) => {
          const r = Math.floor(i / p.cols), c = i % p.cols, k = `${r},${c}`;
          if (!L.cells.has(k)) return <span key={k} className="cw-block" />;
          const bad = checked && fill[k] && fill[k] !== L.cells.get(k);
          return (
            <button key={k} role="gridcell" className={`cw-cell${sel === k ? ' sel' : activeCells.has(k) ? ' act' : ''}${bad ? ' bad' : ''}`} onClick={() => tap(k)} aria-label={`Row ${r + 1}, column ${c + 1}${L.start.has(k) ? `, clue ${L.start.get(k)}` : ''}${fill[k] ? `, ${fill[k]}` : ', empty'}`}>
              {L.start.has(k) && <i>{L.start.get(k)}</i>}{fill[k] ?? ''}
            </button>
          );
        })}
      </div>
      <input ref={input} className="cw-input" aria-label="Type a letter" autoCapitalize="none" autoCorrect="off" spellCheck={false} value="" onChange={(e) => { const ch = e.target.value.slice(-1).toLowerCase(); if (/^[a-z]$/.test(ch)) type(ch); }} onKeyDown={(e) => { if (e.key === 'Backspace') { e.preventDefault(); back(); } }} />
      {solved ? (
        <div className="ws-end"><p className="ws-score">Solved</p><div className="row" style={{ justifyContent: 'center', gap: 8 }}><ShareButton text={shareText()} path="/play/crossword" label="Share my solve" className="btn" /><button className="btn ghost" onClick={() => { setIdx((x) => (x + 1) % CROSSWORDS.length); setFill({}); setSel(null); setChecked(false); }}>Another puzzle</button></div></div>
      ) : (
        <div className="row" style={{ gap: 8, margin: '10px 0' }}><button className="btn small" onClick={check}>Check</button><button className="btn small ghost" onClick={reveal}>Reveal letter</button></div>
      )}
      <p className="vb-msg" aria-live="polite">{note}</p>
      <div className="cw-clues">
        <div><h2>Across</h2><ul className="list">{across.map(clueRow)}</ul></div>
        <div><h2>Down</h2><ul className="list">{down.map(clueRow)}</ul></div>
      </div>
    </div>
  );
}
