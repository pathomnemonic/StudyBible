import { type ReactNode } from 'react';
import { markSeen, useSeen } from '../lib/seen';
import { useSettings } from '../lib/store';

/** A small red dot on something the reader has not opened yet. Put `data-seen="<id>"` on the link or button so opening it clears the dot. */
export function NewDot({ id, label = 'New', inline = false }: { id: string; label?: string; inline?: boolean }) {
  const seen = useSeen(id);
  const [s] = useSettings();
  if (seen || s.hints === false) return null;
  return <i className={inline ? 'new-dot new-inline' : 'new-dot'} role="img" aria-label={label} />;
}

/** A one-time card that explains a feature the first time it is opened, in a sentence or two, with a Got it button. */
export function Tip({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  const seen = useSeen(`tip.${id}`);
  const [s] = useSettings();
  if (seen || s.hints === false) return null;
  return (
    <aside className={`tip-card ${className}`} role="note" aria-label={title}>
      <div className="tip-body"><strong>{title}</strong><div className="tip-text">{children}</div></div>
      <button className="btn small primary" onClick={() => markSeen(`tip.${id}`)}>Got it</button>
    </aside>
  );
}
