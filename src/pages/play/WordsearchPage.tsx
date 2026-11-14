import GameHelp from '../../components/GameHelp';
import { useEffect, useMemo, useRef, useState } from 'react';
import ShareButton from '../../components/ShareButton';
import { WS_THEMES, type WsTheme } from '../../data/wordsearch';
import { dayIndex, recordPlay, markDailyDone } from '../../lib/dailyGame';
import { lineBetween, makeGrid, matchPlaced } from '../../lib/gameLogic';

export { makeGrid };
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
  const [msg, setMsg] = useState('');
  const [shown, setShown] = useState(false); // Show all was pressed: the puzzle is not counted as solved
  const [cur, setCur] = useState<[number, number]>([0, 0]); // keyboard position
  const kbStart = useRef<[number, number] | null>(null);
  const start = useRef<[number, number] | null>(null);
  const t0 = useRef(Date.now());
  useEffect(() => { setFound(new Set()); setSel([]); setShown(false); setMsg(''); kbStart.current = null; t0.current = Date.now(); }, [ti]);
  const cellAt = (x: number, y: number): [number, number] | null => { const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-rc]'); const v = el?.getAttribute('data-rc'); return v ? (v.split(',').map(Number) as [number, number]) : null; };
  const finish = (cells: [number, number][] = sel) => {
    const word = cells.map(([r, c]) => grid[r][c]).join('');
    const hit = matchPlaced(word, placed);
    if (hit && !found.has(hit.word)) { setFound((f) => new Set(f).add(hit.word)); setMsg(`Found ${hit.word}`); } else if (cells.length > 1) setMsg('Not a word in the list');
    start.current = null; setSel([]);
  };
  const done = placed.length > 0 && found.size === placed.length;
  useEffect(() => { if (done && !shown) { if (weekly) markDailyDone('wordsearch', theme.title); else recordPlay('wordsearch'); } }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const inFound = useMemo(() => { const s = new Set<string>(); for (const p of placed) if (found.has(p.word)) for (let i = 0; i < p.word.length; i++) s.add(`${p.r + p.dr * i},${p.c + p.dc * i}`); return s; }, [placed, found]);
  const selSet = new Set(sel.map(([r, c]) => `${r},${c}`));
  const mins = Math.max(1, Math.round((Date.now() - t0.current) / 60000));
  return (
    <div className="page wordsearch">
      <h1>Wordsearch: {theme.title}</h1>
      <GameHelp how={["Find every word in the list; they run in any of eight directions.", "With a mouse or touch, drag across the letters. With a keyboard, move with the arrow keys, press Enter on the first letter, then Enter on the last letter.", "A new theme comes every week."]} />
      <p className="muted small">{weekly ? 'This week’s puzzle.' : 'A practice puzzle.'} Drag across the letters of a word, in any direction. {found.size} of {placed.length} found.</p>
      <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }} role="grid" aria-label="Wordsearch grid"
        onPointerDown={(e) => { const c = cellAt(e.clientX, e.clientY); if (!c) return; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); start.current = c; setSel([c]); }}
        onPointerMove={(e) => { if (!start.current) return; const c = cellAt(e.clientX, e.clientY); if (c) setSel(lineBetween(start.current, c)); }}
        onPointerUp={() => finish()} onPointerCancel={() => { start.current = null; setSel([]); }}>
        {grid.map((row, r) => row.map((ch, c) => {
          const k = `${r},${c}`;
          const onKey = (e: React.KeyboardEvent) => {
            const mv: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
            if (mv[e.key]) {
              e.preventDefault();
              const n: [number, number] = [Math.max(0, Math.min(SIZE - 1, r + mv[e.key][0])), Math.max(0, Math.min(SIZE - 1, c + mv[e.key][1]))];
              setCur(n);
              if (kbStart.current) setSel(lineBetween(kbStart.current, n));
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-rc="${n[0]},${n[1]}"]`)?.focus());
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!kbStart.current) { kbStart.current = [r, c]; setSel([[r, c]]); setMsg(`Start set at ${ch}. Move to the last letter and press Enter.`); }
              else { const cells = lineBetween(kbStart.current, [r, c]); kbStart.current = null; finish(cells); }
            } else if (e.key === 'Escape') { kbStart.current = null; setSel([]); setMsg('Cancelled'); }
          };
          return <span key={k} data-rc={k} role="gridcell" tabIndex={cur[0] === r && cur[1] === c ? 0 : -1} onKeyDown={onKey} onFocus={() => setCur([r, c])}
            aria-label={`${ch}, row ${r + 1}, column ${c + 1}${inFound.has(k) ? ', in a found word' : selSet.has(k) ? ', selected' : ''}`}
            className={`ws-cell${inFound.has(k) ? ' found' : selSet.has(k) ? ' pick' : ''}`}>{ch}</span>;
        }))}
      </div>
      <p className="vb-msg" role="status" aria-live="polite">{msg}</p>
      <ul className="ws-words">{placed.map((p) => <li key={p.word} className={found.has(p.word) ? 'done' : ''}>{found.has(p.word) && <span className="sr-only">Found: </span>}{found.has(p.word) ? '✓ ' : ''}{p.word}</li>)}</ul>
      {done ? (
        <div className="ws-end"><p className="ws-score">{shown ? 'All shown (not counted)' : 'All found!'}</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <ShareButton text={`Wordsearch 🔍 ${theme.title}: all ${placed.length} words in about ${mins} min\n${'🟨'.repeat(placed.length)}`} path="/play/wordsearch" label="Share result" className="btn" />
            <button className="btn ghost" onClick={() => setTi((x) => (x + 1) % WS_THEMES.length)}>Another theme</button>
          </div>
        </div>
      ) : <button className="btn small ghost" onClick={() => { setShown(true); setFound(new Set(placed.map((p) => p.word))); }}>Show all</button>}
    </div>
  );
}
