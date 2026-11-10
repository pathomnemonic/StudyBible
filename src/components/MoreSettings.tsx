import { Link } from 'react-router-dom';
import Fold from './Fold';
import { DEFAULTS, useSettings, type Settings } from '../lib/store';

type Opt<T extends string> = [T, string];
function Choice<T extends string>({ label, value, options, onPick, note }: { label: string; value: T; options: Opt<T>[]; onPick: (v: T) => void; note?: string }) {
  return (
    <div style={{ margin: '10px 0' }}>
      <div className="row between"><span>{label}</span><select aria-label={label} value={value} onChange={(e) => onPick(e.target.value as T)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      {note && <p className="muted small" style={{ margin: '2px 0 0' }}>{note}</p>}
    </div>
  );
}
function Toggle({ label, note, on, onChange }: { label: string; note?: string; on: boolean; onChange: (v: boolean) => void }) {
  return <label className="welcome-check"><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} /><span><strong>{label}</strong>{note && <><br /><small>{note}</small></>}</span></label>;
}

/** Everyday options, each folded away until asked for. Every one starts at a sensible default, so nothing here needs to be touched. */
export default function MoreSettings() {
  const [s, set] = useSettings();
  const reset = () => {
    if (!confirm('Put every setting back to how it was when you first opened the app? Your notes, highlights and progress are not touched.')) return;
    const keep: (keyof Settings)[] = ['onboarded', 'last', 'drive', 'localOnly', 'lastBackup', 'activePlan', 'prayerReminders', 'enabledEditions'];
    const patch: Partial<Settings> = { ...DEFAULTS };
    for (const k of keep) delete patch[k];
    set(patch);
  };
  return (
    <>
      <Fold id="settings:Start and home" title="Start and home" hint="Which tab opens first" open={false}>
        <Choice label="Open the app on" value={s.startPage} options={[['today', 'Today (default)'], ['read', 'Bible'], ['learn', 'Learn'], ['pray', 'Pray']]} onPick={(v) => set({ startPage: v })} note="Applies when you open the app from the home screen or a fresh tab. Links you follow still go where they point." />
        <p className="small"><Link to="/profile">Choose which things appear on Today and in your bar</Link></p>
      </Fold>
      <Fold id="settings:Look and ease of use" title="Look and ease of use" hint="Bigger buttons, underlined links" open={false}>
        <Toggle label="Bigger buttons and tap areas" note="Makes buttons, tabs and fields at least 48 px tall." on={s.bigTargets} onChange={(v) => set({ bigTargets: v })} />
        <Toggle label="Underline links" note="Links are underlined all the time, not only when you point at them." on={s.underlineLinks} onChange={(v) => set({ underlineLinks: v })} />
        <Choice label="Animation" value={s.motion} options={[['calm', 'Calm (default)'], ['full', 'Full'], ['none', 'None, keep everything still']]} onPick={(v) => set({ motion: v })} />
        <Toggle label="Buzz on taps" note="A short vibration where your device supports it." on={s.haptics} onChange={(v) => set({ haptics: v })} />
        <p className="small muted">Colors, text size and fonts are in the Reading section.</p>
      </Fold>
      <Fold id="settings:Dates" title="Calendar" hint="First day of the week" open={false}>
        <Choice label="Week starts on" value={s.weekStart} options={[['sun', 'Sunday (default)'], ['mon', 'Monday']]} onPick={(v) => set({ weekStart: v })} />
      </Fold>
      <Fold id="settings:Lessons and games" title="Lessons and games" hint="How lessons open, pictures, game timers" open={false}>
        <Choice label="Lessons open" value={s.lessonView} options={[['path', 'Step by step (default)'], ['whole', 'As one whole page']]} onPick={(v) => set({ lessonView: v })} />
        <Toggle label="Pictures in lessons" note="Public-domain paintings and engravings. Turn off to save data." on={s.lessonPictures} onChange={(v) => set({ lessonPictures: v })} />
        <Toggle label="Longer time in timed games" note="Doubles the clock in games like Cloister and Charades." on={s.longerTimers} onChange={(v) => set({ longerTimers: v })} />
        <Toggle label="Game streaks and trophies" note="Show streak counters on the games menu." on={s.showStreaks} onChange={(v) => set({ showStreaks: v })} />
      </Fold>
      <Fold id="settings:Privacy on this device" title="History and privacy" hint="What the app remembers" open={false}>
        <Toggle label="Remember what I read and open" note="Feeds the History page and “continue where I left off”. Turning it off stops new entries; it does not delete old ones." on={s.recordHistory} onChange={(v) => set({ recordHistory: v })} />
        <p className="small"><Link to="/history">Open History</Link> to clear it.</p>
      </Fold>
      <Fold id="settings:Reset" title="Start over" hint="Put settings back to the defaults" open={false}>
        <p className="small muted">Resets looks, reading and lesson options only. Notes, highlights, progress and your reading plan stay.</p>
        <button className="btn" onClick={reset}>Reset settings to defaults</button>
      </Fold>
    </>
  );
}
