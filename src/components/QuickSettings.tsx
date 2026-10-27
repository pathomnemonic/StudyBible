import { useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, updateSettings, useSettings } from '../lib/store';
import { TRADITIONS } from '../lib/tradition';
import { LANGS } from '../lib/i18n';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder } from '../liturgy/reminders';
import { setShowSetting, showSetting } from '../data/PlayerContext';
import { useEditions } from '../data/EditionsContext';

/** The settings people reach for most, all open at once on the You page: look, language and Church, reminders, sound. Everything else is in Settings. */
export default function QuickSettings() {
  const [s] = useSettings();
  const { editions } = useEditions();
  const [remMsg, setRemMsg] = useState('');
  const [skips, setSkips] = useState(() => [showSetting('all', 'back') || 15, showSetting('all', 'fwd') || 30]);
  const shown = editions.filter((e) => !e.offByDefault || e.id === s.defaultEdition);
  return (
    <section className="qs" aria-label="Make it yours">
      <div className="qs-block">
        <h3>Layout</h3>
        <div className="level-chips" role="group" aria-label="Layout">
          <button className={`chip${s.layout === 'compact' ? ' sel' : ''}`} aria-pressed={s.layout === 'compact'} onClick={() => updateSettings({ layout: 'compact' })}>Compact</button>
          <button className={`chip${s.layout === 'classic' ? ' sel' : ''}`} aria-pressed={s.layout === 'classic'} onClick={() => updateSettings({ layout: 'classic' })}>Classic</button>
        </div>
      </div>
      <div className="qs-block">
        <h3>Color</h3>
        <div className="qs-themes" role="group" aria-label="Color theme">
          {THEMES.map(([k, l, bg, fg, ac]) => (
            <button key={k} className={`qs-theme${s.theme === k ? ' on' : ''}`} aria-pressed={s.theme === k} onClick={() => updateSettings({ theme: k })} title={l}>
              <span className="qs-sw" style={{ background: bg, color: fg, borderColor: ac }}><b style={{ background: ac }} />Aa</span>
              <small>{l.replace(' (default)', '')}</small>
            </button>
          ))}
        </div>
        <div className="welcome-row"><span>Text size</span>
          <span className="tour-switch" role="group" aria-label="Text size"><button onClick={() => updateSettings({ fontSize: Math.max(14, s.fontSize - 2) })} aria-label="Smaller text">A−</button><span className="tour-size">{s.fontSize}</span><button onClick={() => updateSettings({ fontSize: Math.min(32, s.fontSize + 2) })} aria-label="Larger text">A+</button></span></div>
      </div>
      <div className="qs-block">
        <h3>Language and Church</h3>
        <label className="welcome-row"><span>Language</span><select value={s.language} onChange={(e) => updateSettings({ language: e.target.value as typeof s.language })} aria-label="Language">{LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="welcome-row"><span>Your Church</span><select value={s.tradition} onChange={(e) => updateSettings({ tradition: e.target.value as typeof s.tradition })} aria-label="Your Church">{TRADITIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="welcome-row"><span>Calendar</span><select value={s.diocese} onChange={(e) => updateSettings({ diocese: e.target.value })} aria-label="Calendar">{Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="welcome-row"><span>Bible translation</span><select value={s.defaultEdition} onChange={(e) => updateSettings({ defaultEdition: e.target.value })} aria-label="Bible translation">{shown.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <label className="welcome-row"><span>Spelling</span><select value={s.spelling} onChange={(e) => updateSettings({ spelling: e.target.value as 'us' | 'uk' })} aria-label="Spelling"><option value="us">US (color)</option><option value="uk">British (colour)</option></select></label>
      </div>
      <div className="qs-block">
        <h3>Daily rhythm</h3>
        <label className="welcome-check"><input type="checkbox" checked={s.reminders.enabled} onChange={async (e) => {
          if (e.target.checked) { const r = await enableReminders(); setRemMsg(r === 'granted' ? '' : r === 'denied' ? 'Notifications are blocked in the browser; allow them in its settings.' : 'This browser does not support notifications.'); updateSettings({ reminders: { ...s.reminders, enabled: r === 'granted' } }); }
          else updateSettings({ reminders: { ...s.reminders, enabled: false } });
          setTimeout(scheduleReminder, 50);
        }} /><span><strong>Daily reminder</strong><br /><small>A nudge to pray and read, while the app is open or installed.</small></span></label>
        {s.reminders.enabled && <label className="welcome-row"><span>At</span><input type="time" value={s.reminders.time} onChange={(e) => { updateSettings({ reminders: { ...s.reminders, time: e.target.value } }); setTimeout(scheduleReminder, 50); }} aria-label="Reminder time" /></label>}
        {remMsg && <p className="welcome-note" role="status">{remMsg}</p>}
        <label className="welcome-check"><input type="checkbox" checked={s.ambience.kind !== 'off'} onChange={(e) => updateSettings({ ambience: { ...s.ambience, kind: e.target.checked ? 'auto' : 'off' } })} /><span><strong>Soft background sound while reading</strong></span></label>
        <div className="qs-row"><span>Audio skip buttons (shows can set their own)</span>
          <label>Back <select value={skips[0]} onChange={(e) => { setShowSetting('all', 'back', +e.target.value); setSkips([+e.target.value, skips[1]]); }}>{[10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n}s</option>)}</select></label>
          <label>Forward <select value={skips[1]} onChange={(e) => { setShowSetting('all', 'fwd', +e.target.value); setSkips([skips[0], +e.target.value]); }}>{[10, 15, 20, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n}s</option>)}</select></label>
        </div>
        <label className="welcome-check"><input type="checkbox" checked={s.keepAwake} onChange={(e) => updateSettings({ keepAwake: e.target.checked })} /><span><strong>Keep the screen awake while reading and praying</strong></span></label>
        <label className="welcome-check"><input type="checkbox" checked={s.hints} onChange={(e) => updateSettings({ hints: e.target.checked })} /><span><strong>Show red dots and short tips</strong></span></label>
      </div>
      <p className="hub-hint" style={{ margin: 0 }}>More: <Link to="/settings">all settings</Link> · <Link to="/downloads">downloads</Link></p>
    </section>
  );
}
