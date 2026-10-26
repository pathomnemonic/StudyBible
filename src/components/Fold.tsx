import { useState, type ReactNode } from 'react';

/** A section that is folded until asked for, so a screen starts calm. The open or closed state is remembered for the session. */
export default function Fold({ id, title, hint, children, open }: { id: string; title: ReactNode; hint?: ReactNode; children: ReactNode; open?: boolean }) {
  const key = `sb:fold:${id}`;
  const [on, setOn] = useState(() => { try { const v = sessionStorage.getItem(key); return v === null ? !!open : v === '1'; } catch { return !!open; } });
  return (
    <details className="fold" open={on} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOn(o); try { sessionStorage.setItem(key, o ? '1' : '0'); } catch { /* private mode */ } }}>
      <summary><span className="fold-t">{title}</span>{hint && <span className="fold-h">{hint}</span>}<span className="fold-chev" aria-hidden="true">›</span></summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
