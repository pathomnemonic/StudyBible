import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '../lib/features';
import { markSeen } from '../lib/seen';
import { tipKey } from '../lib/dotTips';

/** The short note that appears the first time a not-so-obvious feature is tapped: what it is, then Open it. */
export default function DotTips() {
  const [id, setId] = useState<string | null>(null);
  const nav = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: Event) => setId((e as CustomEvent<{ id: string }>).detail.id);
    window.addEventListener('studybible:dottip', h);
    return () => window.removeEventListener('studybible:dottip', h);
  }, []);
  useEffect(() => { if (id) box.current?.focus(); }, [id]);
  useEffect(() => {
    if (!id) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const f = FEATURES.find((x) => x.id === id);
  if (!id || !f) return null;
  const close = () => { markSeen(tipKey(id)); setId(null); };
  const open = () => { markSeen(tipKey(id), id); setId(null); nav(f.to); };
  return (
    <div className="dottip-layer" onClick={close}>
      <div className="dottip" role="dialog" aria-modal="true" aria-label={f.title} ref={box} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <strong>{f.title}</strong>
        <p>{f.blurb}</p>
        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={close}>Not now</button>
          <button className="btn primary" onClick={open}>Open it</button>
        </div>
      </div>
    </div>
  );
}
