import { useEffect, useId, useState } from 'react';
import { setPractice } from '../lib/dailyGame';

/**
 * A short "How to play" fold with a visible label, and a Practice switch. While Practice is on, the game still plays
 * normally but nothing it finishes is counted: no streak day, best score, daily mark, trophy or sticker.
 * `onPractice` lets a game with its own practice state (Verbum) follow the switch.
 */
export default function GameHelp({ how, onPractice }: { how: string[]; onPractice?: (on: boolean) => void }) {
  const [on, setOn] = useState(false);
  const id = useId();
  useEffect(() => { setPractice(on); onPractice?.(on); }, [on]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => setPractice(false), []);
  return (
    <div className="game-help">
      <details>
        <summary>How to play</summary>
        <ul>{how.map((h) => <li key={h}>{h}</li>)}</ul>
      </details>
      <label className="small" htmlFor={id} style={{ display: 'block', margin: '6px 0' }}>
        <input id={id} type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> Practice mode
        <span className="muted"> {on ? 'On: this play will not count toward totals, bests or trophies.' : 'Play without it counting toward totals, bests or trophies.'}</span>
      </label>
    </div>
  );
}
