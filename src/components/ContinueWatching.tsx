import { useEffect, useState } from 'react';
import InlinePlayer from './InlinePlayer';
import { embedFor } from '../lib/embed';
import { clearPos, inProgress } from '../lib/videoResume';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Videos you started and have not finished, each one tap from where you stopped. Renders nothing when there are none. */
export default function ContinueWatching({ onPlay }: { onPlay?: (id: string, title: string) => void }) {
  const [rows, setRows] = useState(inProgress);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const h = () => setRows(inProgress());
    window.addEventListener('studybible:vpos', h);
    return () => window.removeEventListener('studybible:vpos', h);
  }, []);
  if (!rows.length) return null;
  return (
    <section className="card cw" aria-label="Continue watching">
      <h2 className="h-sm">Continue watching</h2>
      <ul className="cw-list">
        {rows.slice(0, 4).map(({ id, p }) => (
          <li key={id}>
            <strong className="cw-title">{p.title}</strong>
            <div className="cw-bar" role="progressbar" aria-valuenow={Math.round((p.t / Math.max(p.d, 1)) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round((p.t / Math.max(p.d, 1)) * 100)} percent watched`}><i style={{ width: `${Math.min(100, (p.t / Math.max(p.d, 1)) * 100)}%` }} /></div>
            {open === id ? <InlinePlayer embed={embedFor(`https://www.youtube.com/watch?v=${id}`)!} title={p.title} /> : (
              <div className="row" style={{ gap: 6 }}>
                <button className="btn small primary" onClick={() => { setOpen(id); onPlay?.(id, p.title); }}>▶ Resume at {clock(p.t)}</button>
                <button className="btn small ghost" onClick={() => clearPos(id)}>Remove</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
