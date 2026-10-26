import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isSeen, markSeen, useSeen } from '../lib/seen';
import { startHere, type Hub } from '../lib/features';
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

/** Three good places to begin in a tab, chosen from what the reader said they came for, each with a red dot until opened. */
export function StartHere({ hub }: { hub: Hub }) {
  const [s] = useSettings();
  const pool = startHere(hub, s.interests, 8);
  const items = [...pool.filter((f) => !isSeen(f.id)), ...pool.filter((f) => isSeen(f.id))].slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="start-here" aria-label="Start here">
      <h2 className="eyebrow-h">Start here</h2>
      <ul>
        {items.map((f) => (
          <li key={f.id}><Link to={f.to} data-seen={f.id}><strong>{f.title} <NewDot id={f.id} inline /></strong><span>{f.blurb}</span></Link></li>
        ))}
      </ul>
    </section>
  );
}
