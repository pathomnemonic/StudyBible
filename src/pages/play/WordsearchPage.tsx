import { useEffect, useMemo, useRef, useState } from 'react';
import ShareButton from '../../components/ShareButton';
import { WS_THEMES, type WsTheme } from '../../data/wordsearch';
import { dayIndex, recordPlay, seeded, markDailyDone } from '../../lib/dailyGame';

const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
interface Placed { word: string; r: number; c: number; dr: number; dc: number }

/** Lay the words on a square grid in any of eight directions, then fill the gaps with letters. The same seed always makes the same puzzle. */
export function makeGrid(words: string[], size: number, seed: number): { grid: string[][]; placed: Placed[] } {
  const rnd = seeded(seed);
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placed: Placed[] = [];
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    if (word.length > size) continue;
    for (let tries = 0; tries < 400; tries++) {
      const [dr, dc] = DIRS[Math.floor(rnd() * DIRS.length)];
      const r = Math.floor(rnd() * size), c = Math.floor(rnd() * size);
      const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
      if (er < 0 || ec < 0 || er >= size || ec >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length && ok; i++) { const ch = grid[r + dr * i][c + dc * i]; if (ch && ch !== word[i]) ok = false; }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r + dr * i][c + dc * i] = word[i];
      placed.push({ word, r, c, dr, dc });
      break;
    }
  }
  const letters = 'EEEEAAAIIOONNRRTTLSUDGBCMPFHVWYKJXQZ';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = letters[Math.floor(rnd() * letters.length)];
  return { grid, placed };
}
const weekNo = () => Math.floor((dayIndex() + 3) / 7);
const SIZE = 11;

/** A wordsearch on a theme from the Bible and the faith, a new one each week. Drag across the letters of a word. */
export default function WordsearchPage() {
  const [ti, setTi] = useState(weekNo() % WS_THEMES.length);
  const theme: WsTheme = WS_THEMES[ti];
  const weekly = ti === weekNo() % WS_THEMES.length;
  const { grid, placed } = useMemo(() => makeGrid(theme.words, SIZE, ti * 97 + 13), [theme]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<[number, number][]>([]);
  const start = useRef<[number, number] | null>(null);
  const t0 = useRef(Date.now());
  useEffect(() => { setFound(new Set()); setSel([]); t0.current = Date.now(); }, [ti]);
  const cellAt = (x: number, y: number): [number, number] | null => { const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-rc]'); const v = el?.getAttribute('data-rc'); return v ? (v.split(',').map(Number) as [number, number]) : null; };
  const lineTo = (a: [number, number], b: [number, number]): [number, number][] => {
    const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    if (n && Math.abs(b[0] - a[0]) !== 0 && Math.abs(b[1] - a[1]) !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return [a];
    return Array.from({ length: n + 1 }, (_, i) => [a[0] + dr * i, a[1] + dc * i] as [number, number]);
  };
  const finish = () => {
    const word = sel.map(([r, c]) => grid[r][c]).join('');
    const hit = placed.find((p) => p.word === word || p.word === [...word].reverse().join(''));
    if (hit && !found.has(hit.word)) setFound((f) => new Set(f).add(hit.word));
    start.current = null; setSel([]);
  };
  const done = placed.length > 0 && found.size === placed.length;
  useEffect(() => { if (done) { if (weekly) markDailyDone('wordsearch', theme.title); else recordPlay('wordsearch'); } }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const inFound = useMemo(() => { const s = new Set<string>(); for (const p of placed) if (found.has(p.word)) for (let i = 0; i < p.word.length; i++) s.add(`${p.r + p.dr * i},${p.c + p.dc * i}`); return s; }, [placed, found]);
  const selSet = new Set(sel.map(([r, c]) => `${r},${c}`));
  const mins = Math.max(1, Math.round((Date.now() - t0.current) / 60000));
  return (
    <div className="page wordsearch">
      <h1>Wordsearch: {theme.title}</h1>
      <p className="muted small">{weekly ? 'This week’s puzzle.' : 'A practice puzzle.'} Drag across the letters of a word, in any direction. {found.size} of {placed.length} found.</p>
      <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }} role="grid" aria-label="Wordsearch grid"
        onPointerDown={(e) => { const c = cellAt(e.clientX, e.clientY); if (!c) return; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); start.current = c; setSel([c]); }}
        onPointerMove={(e) => { if (!start.current) return; const c = cellAt(e.clientX, e.clientY); if (c) setSel(lineTo(start.current, c)); }}
        onPointerUp={finish} onPointerCancel={() => { start.current = null; setSel([]); }}>
        {grid.map((row, r) => row.map((ch, c) => <span key={`${r},${c}`} data-rc={`${r},${c}`} role="gridcell" className={`ws-cell${inFound.has(`${r},${c}`) ? ' found' : selSet.has(`${r},${c}`) ? ' pick' : ''}`}>{ch}</span>))}
      </div>
      <ul className="ws-words">{placed.map((p) => <li key={p.word} className={found.has(p.word) ? 'done' : ''}>{p.word}</li>)}</ul>
      {done ? (
        <div className="ws-end"><p className="ws-score">All found!</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <ShareButton text={`Wordsearch 🔍 ${theme.title}: all ${placed.length} words in about ${mins} min\n${'🟨'.repeat(placed.length)}`} path="/play/wordsearch" label="Share result" className="btn" />
            <button className="btn ghost" onClick={() => setTi((x) => (x + 1) % WS_THEMES.length)}>Another theme</button>
          </div>
        </div>
      ) : <button className="btn small ghost" onClick={() => setFound(new Set(placed.map((p) => p.word)))}>Show all</button>}
    </div>
  );
}
