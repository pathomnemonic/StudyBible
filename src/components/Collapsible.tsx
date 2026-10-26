import type { ReactNode } from 'react';

/** A section that opens and closes, with a clear arrow so it never looks like a link. */
export default function Collapsible({ title, sub, badge, open, onToggle, children }: { title: ReactNode; sub?: ReactNode; badge?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className={`coll${open ? ' open' : ''}`}>
      <button className="coll-head" aria-expanded={open} onClick={onToggle}>
        <span className="coll-main"><span className="coll-t">{title}</span>{sub && <span className="coll-s">{sub}</span>}</span>
        {badge}
        <span className="coll-chev" aria-hidden="true">▾</span>
      </button>
      {open && <div className="coll-body">{children}</div>}
    </section>
  );
}

/** Expand every section, or fold them all away. */
export function ExpandAll({ all, onChange }: { all: boolean; onChange: (open: boolean) => void }) {
  return <button className="btn small ghost" onClick={() => onChange(!all)}>{all ? 'Collapse all' : 'Expand all'}</button>;
}
