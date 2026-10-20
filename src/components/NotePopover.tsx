import { useEffect, useRef } from 'react';

/** The ordinary footnotes on a verse: alternate readings, manuscript variants, meanings of names. */
export default function NotePopover({ notes, at, verse, source, onClose }: { notes: string[]; at: DOMRect; verse: number; source: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const d = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('.rm-std')) onClose(); };
    document.addEventListener('keydown', k);
    document.addEventListener('mousedown', d);
    box.current?.focus();
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('mousedown', d); };
  }, [verse]);
  const W = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(window.innerWidth - W - 12, at.left + at.width / 2 - W / 2));
  const below = at.bottom + 12 + 200 < window.innerHeight;
  const style: React.CSSProperties = { left, width: W, ...(below ? { top: at.bottom + 10 } : { bottom: window.innerHeight - at.top + 10 }) };
  return (
    <div ref={box} className="term-pop note-pop" style={style} role="dialog" aria-label={`Notes on verse ${verse}`} tabIndex={-1}>
      <div className="kicker">Note on the text · verse {verse}</div>
      {notes.map((n, i) => <p key={i}>{n}</p>)}
      <div className="muted small">{source}</div>
    </div>
  );
}
