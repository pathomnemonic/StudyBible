import { useState } from 'react';
import { setShowSetting, showPrefs } from '../data/PlayerContext';
import Modal from './Modal';
import { SPEEDS } from './NowPlaying';

const STEPS = [10, 15, 20, 30, 45, 60, 90];

/** How one show plays, remembered for that show only: speed, the intro and closing to skip, the size of the skip buttons, and whether the next one starts by itself. */
export default function ShowSettings({ showKey, name, onClose }: { showKey: string; name: string; onClose: () => void }) {
  const [v, setV] = useState(() => showPrefs(showKey));
  const set = (k: 'rate' | 'skip' | 'outro' | 'fwd' | 'back' | 'manual', n: number) => {
    setShowSetting(showKey, k, n);
    setV(showPrefs(showKey));
  };
  const num = (k: 'skip' | 'outro', val: number) => (
    <input type="number" min={0} max={600} value={val} style={{ width: 80 }} onChange={(e) => set(k, Math.max(0, Math.min(600, Math.round(+e.target.value) || 0)))} />
  );
  return (
    <Modal title={`${name}: settings`} onClose={onClose}>
      <div className="show-settings">
        <p className="muted small">These apply to this show only.</p>
        <label className="ss-row"><span>Speed<small>The pace this show plays at</small></span>
          <select value={v.rate || ''} onChange={(e) => set('rate', +e.target.value)}><option value="">Your usual</option>{SPEEDS.map((r) => <option key={r} value={r}>{r}×</option>)}</select>
        </label>
        <label className="ss-row"><span>Skip the intro<small>Seconds jumped at the start of each episode</small></span>{num('skip', v.intro)}</label>
        <label className="ss-row"><span>Skip the ending<small>Seconds left unplayed at the end (closing music, ads)</small></span>{num('outro', v.outro)}</label>
        <label className="ss-row"><span>Forward button<small>Seconds</small></span>
          <select value={v.fwd} onChange={(e) => set('fwd', +e.target.value)}>{STEPS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <label className="ss-row"><span>Back button<small>Seconds</small></span>
          <select value={v.back} onChange={(e) => set('back', +e.target.value)}>{STEPS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <label className="ss-row"><span>Play the next one by itself<small>Moves on from your queue or favorites when this one ends</small></span>
          <input type="checkbox" checked={v.auto} onChange={(e) => set('manual', e.target.checked ? 0 : 1)} />
        </label>
        <button className="btn small" onClick={() => { for (const k of ['rate', 'skip', 'outro', 'fwd', 'back', 'manual'] as const) set(k, 0); }}>Back to the usual</button>
      </div>
    </Modal>
  );
}
