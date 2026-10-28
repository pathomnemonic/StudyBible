import { useEffect, useState, type ReactNode } from 'react';
import { NewDot } from './Hints';

/** A section that is folded until asked for, so a screen starts calm. The open or closed state is remembered for the session. */
export default function Fold({ id, title, hint, children, open }: { id: string; title: ReactNode; hint?: ReactNode; children: ReactNode; open?: boolean }) {
  const key = `sb:fold:${id}`;
  const [on, setOn] = useState(() => { try { const v = sessionStorage.getItem(key); return v === null ? !!open : v === '1'; } catch { return !!open; } });
  useEffect(() => {
    const h = (e: Event) => { const o = (e as CustomEvent<boolean>).detail; setOn(o); try { sessionStorage.setItem(key, o ? '1' : '0'); } catch { /* private mode */ } };
    window.addEventListener('studybible:foldall', h);
    return () => window.removeEventListener('studybible:foldall', h);
  }, [key]);
  return (
    <details className="fold" data-fold-key={key} open={on} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOn(o); if ((window as unknown as { __sbAuto?: boolean }).__sbAuto) return; try { sessionStorage.setItem(key, o ? '1' : '0'); } catch { /* private mode */ } }}>
      <summary data-seen={`fold.${id}`}><span className="fold-t">{title}</span>{!on && <NewDot id={`fold.${id}`} />}{hint && <span className="fold-h">{hint}</span>}<span className="fold-chev" aria-hidden="true">›</span></summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}

/** "Expand all / Collapse all" for a page with several folds. */
export function FoldControls() {
  const send = (open: boolean) => window.dispatchEvent(new CustomEvent('studybible:foldall', { detail: open }));
  return <div className="fold-controls"><button className="btn small ghost" onClick={() => send(true)}>Expand all</button><button className="btn small ghost" onClick={() => send(false)}>Collapse all</button></div>;
}
