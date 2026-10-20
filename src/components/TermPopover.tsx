import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { TermBrief } from '../study/terms';

/** A small card about a sparkling key word or phrase, with a way to the full page and a way to switch sparkles off. */
export default function TermPopover({ term, at, onClose, onOff }: { term: TermBrief; at: DOMRect; onClose: () => void; onOff: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const d = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('.term')) onClose(); };
    document.addEventListener('keydown', k);
    document.addEventListener('mousedown', d);
    box.current?.focus();
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('mousedown', d); };
  }, [term.id]);
  const W = Math.min(340, window.innerWidth - 24);
  const left = Math.max(12, Math.min(window.innerWidth - W - 12, at.left + at.width / 2 - W / 2));
  const below = at.bottom + 12 + 220 < window.innerHeight;
  const style: React.CSSProperties = { left, width: W, ...(below ? { top: at.bottom + 10 } : { bottom: window.innerHeight - at.top + 10 }) };
  return (
    <div ref={box} className="term-pop" style={style} role="dialog" aria-label={`About: ${term.title}`} tabIndex={-1}>
      <div className="kicker">Key {term.kind === 'title' ? 'title' : term.kind === 'name' ? 'name' : 'word or phrase'}</div>
      <h2>{term.title}</h2>
      <p>{term.gist.length > 260 ? term.gist.slice(0, term.gist.lastIndexOf(' ', 260)) + '…' : term.gist}</p>
      <div className="row between">
        <Link className="btn primary small" to={`/study/term/${term.id}`}>Where it appears</Link>
        <button className="linklike small" onClick={onOff}>Turn sparkles off</button>
      </div>
    </div>
  );
}
