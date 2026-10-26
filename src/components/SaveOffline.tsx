import { useRef, useState } from 'react';
import { canSave, estimateBytes, fmtBytes, removeAudio, saveAudio, SaveError, useSaved, type Saveable } from '../lib/offlineAudio';

/** Save one episode to this device so it plays with no signal. Shows the real size once it is saved. */
export default function SaveOffline({ ep, compact = false }: { ep: Saveable; compact?: boolean }) {
  const saved = useSaved().find((s) => s.id === ep.id);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const ctl = useRef<AbortController | null>(null);
  if (!canSave(ep.audio)) return null;
  const go = async () => {
    setErr(''); setPct(0); ctl.current = new AbortController();
    try { await saveAudio(ep, (g, t) => setPct(Math.min(99, Math.round((100 * g) / t))), ctl.current.signal); }
    catch (e) { if (!(e instanceof SaveError && e.kind === 'cancelled')) setErr((e as Error).message); }
    setPct(null);
  };
  if (pct !== null) return <button className="btn small" onClick={() => ctl.current?.abort()} title="Tap to stop">{pct}% ✕</button>;
  if (saved) return <span><button className="btn small ghost" onClick={() => void removeAudio(ep.id, ep.audio)} aria-label={compact ? `Saved offline, ${fmtBytes(saved.bytes)}. Tap to remove` : undefined} title={`Saved on this device (${fmtBytes(saved.bytes)}). Tap to remove.`}>✓ Offline{compact ? '' : ` · ${fmtBytes(saved.bytes)}`}</button></span>;
  return (
    <span>
      <button className="btn small ghost" onClick={go} aria-label={compact ? `Save for offline, about ${fmtBytes(estimateBytes(ep.duration))}` : undefined} title={`Save to this device, about ${fmtBytes(estimateBytes(ep.duration))}`}>⬇ {compact ? '' : `Save · ~${fmtBytes(estimateBytes(ep.duration))}`}</button>
      {err && <span className="small" role="alert" style={{ display: 'block', maxWidth: 280 }}>{err}</span>}
    </span>
  );
}
