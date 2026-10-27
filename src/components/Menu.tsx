import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem { label: ReactNode; onClick: () => void; on?: boolean }

/** A "⋯" button that opens a short list of choices; it closes when you pick one, tap outside, or press Escape. */
export default function Menu({ items, label = 'More' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="menu" ref={box}>
      <button className="btn icon" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>⋯</button>
      {open && (
        <ul className="menu-list" role="menu">
          {items.map((it, i) => (
            <li key={i} role="none"><button role="menuitem" className={it.on ? 'on' : ''} onClick={() => { setOpen(false); it.onClick(); }}>{it.on !== undefined && <span aria-hidden="true">{it.on ? '✓' : ''}</span>}{it.label}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
