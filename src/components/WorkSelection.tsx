import { useEffect, useState } from 'react';
import type { HighlightColor } from '../db/db';

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

/** A small bar over a selection inside the text of a work: highlight in a color, add a note, or copy. */
export default function WorkSelection({ onHighlight, onNote }: { onHighlight: (quote: string, paraIndex: number, color: HighlightColor) => void; onNote: (quote: string, paraIndex: number) => void }) {
  const [pos, setPos] = useState<{ x: number; y: number; text: string; p: number } | null>(null);
  useEffect(() => {
    const f = () => {
      const s = window.getSelection();
      const t = s?.toString().trim() ?? '';
      if (!s || s.isCollapsed || t.length < 3 || t.length > 700) { setPos(null); return; }
      const para = (s.anchorNode?.parentElement ?? null)?.closest('p[data-p]') as HTMLElement | null;
      const end = (s.focusNode?.parentElement ?? null)?.closest('p[data-p]') as HTMLElement | null;
      if (!para || para !== end) { setPos(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setPos({ x: Math.min(window.innerWidth - 230, Math.max(8, r.left + r.width / 2 - 105)), y: Math.max(60, r.top - 50), text: t, p: +para.dataset.p! });
    };
    document.addEventListener('selectionchange', f);
    return () => document.removeEventListener('selectionchange', f);
  }, []);
  if (!pos) return null;
  const done = () => { window.getSelection()?.removeAllRanges(); setPos(null); };
  return (
    <div className="work-sel" style={{ left: pos.x, top: pos.y }} role="toolbar" aria-label="Selected text" onMouseDown={(e) => e.preventDefault()}>
      {COLORS.map((c) => <button key={c} className="work-sel-dot" style={{ background: `var(--hl-${c})` }} aria-label={`Highlight ${c}`} onClick={() => { onHighlight(pos.text, pos.p, c); done(); }} />)}
      <button className="btn small" onClick={() => { onNote(pos.text, pos.p); done(); }}>Note</button>
      <button className="btn small" onClick={() => { void navigator.clipboard?.writeText(pos.text); done(); }}>Copy</button>
      <button className="btn small" onClick={async () => { const t = `“${pos.text}” (${document.title})`; try { if (navigator.share) await navigator.share({ text: t }); else await navigator.clipboard?.writeText(t); } catch { /* cancelled */ } done(); }}>Share</button>
    </div>
  );
}
