import { useState, type ReactNode } from 'react';

/** The search and one "Filters" button share a row; the other controls open under them, and the button shows how many are in use. */
export default function FilterBar({ search, active = 0, children, extra }: { search: ReactNode; active?: number; children: ReactNode; extra?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="filterbar">
      <div className="filterbar-top">
        {search}
        <button type="button" className="fb-btn" aria-expanded={open} onClick={() => setOpen(!open)}>Filters{active > 0 && <span className="fb-count">{active}</span>}</button>
        {extra}
      </div>
      {open && <div className="filterbar-body">{children}</div>}
    </div>
  );
}
