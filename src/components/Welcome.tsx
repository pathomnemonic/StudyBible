import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, updateSettings, useSettings, type ThemeName } from '../lib/store';
import { TRADITIONS } from '../lib/tradition';
import { LANGS } from '../lib/i18n';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder } from '../liturgy/reminders';
import { useEditions } from '../data/EditionsContext';
import { startHere } from '../lib/features';

const DONE = 'sb:tour';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

const INTERESTS: [string, string, string][] = [
  ['bible', 'Read the Bible', 'Daily reading, plans and Bible in a Year'],
  ['pray', 'Pray every day', 'Rosary, Mass, devotions and the Church’s year'],
  ['study', 'Learn the faith', 'Catechism, Fathers, lessons and tough questions'],
  ['listen', 'Listen and watch', 'Podcasts, audiobooks, videos and recorded prayers'],
  ['teach', 'Teach or lead a class', 'K–12 program, slides, live games and gradebook'],
  ['family', 'Raise a family in the faith', 'Children’s Bible, family prayer and lessons'],
];
const PICK: ThemeName[] = ['twilight', 'light', 'paper', 'sepia', 'dark', 'zen'];
const STEPS = ['What brings you here?', 'Your Church and calendar', 'Your Bible and look', 'Your daily rhythm', 'You’re set'];

/** The first-run setup: five short steps that tailor the app to the reader, instead of a long tour. Everything can be changed later in Settings. */
export default function Welcome() {
  const [on, setOn] = useState(() => get(DONE) !== '1');
  const [i, setI] = useState(0);
  const [s] = useSettings();
  const { editions } = useEditions();
  const [remMsg, setRemMsg] = useState('');
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => { if (on) { updateSettings({ ambienceTipSeen: true }); card.current?.focus(); } }, [on]);
  useEffect(() => { card.current?.focus(); }, [i]);
  if (!on) return null;
  const done = (tour = false) => {
    put(DONE, '1'); put('sb:welcomed', '1'); put('sb:whatsNew', '2026-10b');
    updateSettings({ onboarded: true });
    setOn(false);
    if (tour) window.setTimeout(() => window.dispatchEvent(new Event('studybible:tour')), 200);
  };
  const toggleInterest = (id: string) => updateSettings({ interests: s.interests.includes(id) ? s.interests.filter((x) => x !== id) : [...s.interests, id] });
  const shown = editions.filter((e) => !e.offByDefault || e.id === s.defaultEdition);
  const last = i === STEPS.length - 1;
  const suggestions = startHere(null, s.interests, 3);
  return (
    <div className="welcome-layer" role="dialog" aria-modal="true" aria-label="Set up Study Bible">
      <div className="welcome-card" ref={card} tabIndex={-1}>
        <div className="welcome-dots" aria-hidden>{STEPS.map((_, n) => <i key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />)}</div>
        <p className="welcome-step">{i === 0 ? 'Welcome to Study Bible' : `Step ${i + 1} of ${STEPS.length}`}</p>
        <h1 className="welcome-title">{STEPS[i]}</h1>

        {i === 0 && <>
          <p className="welcome-sub">Pick anything that fits. We will put those things first. This takes about a minute.</p>
          <div className="welcome-chips" role="group" aria-label="What brings you here">
            {INTERESTS.map(([id, label, d]) => (
              <button key={id} className={`welcome-chip${s.interests.includes(id) ? ' on' : ''}`} aria-pressed={s.interests.includes(id)} onClick={() => toggleInterest(id)}>
                <strong>{label}</strong><span>{d}</span>
              </button>
            ))}
          </div>
        </>}

        {i === 1 && <>
          <p className="welcome-sub">This sets the calendar, the readings and which prayers you see.</p>
          <label className="welcome-row"><span>Your Church</span>
            <select value={s.tradition} onChange={(e) => updateSettings({ tradition: e.target.value as typeof s.tradition })} aria-label="Your Church">{TRADITIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="welcome-row"><span>Calendar and holy days</span>
            <select value={s.diocese} onChange={(e) => updateSettings({ diocese: e.target.value })} aria-label="Liturgical calendar">{Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="welcome-row"><span>Language</span>
            <select value={s.language} onChange={(e) => updateSettings({ language: e.target.value as typeof s.language })} aria-label="Language">{LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="welcome-row"><span>Spelling</span>
            <select value={s.spelling} onChange={(e) => updateSettings({ spelling: e.target.value as 'us' | 'uk' })} aria-label="Spelling" data-keep-spelling><option value="us">US English (color)</option><option value="uk">British English (colour)</option></select></label>
        </>}

        {i === 2 && <>
          <label className="welcome-row"><span>Translation</span>
            <select value={s.defaultEdition} onChange={(e) => updateSettings({ defaultEdition: e.target.value })} aria-label="Translation">{shown.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
          <div className="welcome-row"><span>Text size</span>
            <span className="tour-switch" role="group" aria-label="Text size"><button onClick={() => updateSettings({ fontSize: Math.max(14, s.fontSize - 2) })} aria-label="Smaller text">A−</button><span className="tour-size">{s.fontSize}</span><button onClick={() => updateSettings({ fontSize: Math.min(32, s.fontSize + 2) })} aria-label="Larger text">A+</button></span></div>
          <div className="welcome-row"><span>Look</span>
            <span className="tour-switch" role="group" aria-label="Theme">{PICK.map((id) => { const t = THEMES.find((x) => x[0] === id); return t ? <button key={id} className={s.theme === id ? 'on' : ''} aria-pressed={s.theme === id} onClick={() => updateSettings({ theme: id })}>{t[1]}</button> : null; })}</span></div>
          <p className="welcome-preview" style={{ fontSize: s.fontSize }}>In the beginning was the Word, and the Word was with God, and the Word was God.</p>
        </>}

        {i === 3 && <>
          <label className="welcome-check"><input type="checkbox" checked={s.reminders.enabled} onChange={async (e) => {
            if (e.target.checked) { const r = await enableReminders(); setRemMsg(r === 'granted' ? '' : r === 'denied' ? 'Notifications were blocked in the browser; you can allow them in its settings.' : 'This browser does not support notifications.'); updateSettings({ reminders: { ...s.reminders, enabled: r === 'granted' } }); }
            else updateSettings({ reminders: { ...s.reminders, enabled: false } });
            setTimeout(scheduleReminder, 50);
          }} /><span><strong>Remind me to pray and read each day</strong><br /><small>A gentle nudge, only while the app is open or installed.</small></span></label>
          {s.reminders.enabled && <label className="welcome-row"><span>At what time?</span><input type="time" value={s.reminders.time} onChange={(e) => { updateSettings({ reminders: { ...s.reminders, time: e.target.value } }); setTimeout(scheduleReminder, 50); }} aria-label="Reminder time" /></label>}
          {remMsg && <p className="welcome-note" role="status">{remMsg}</p>}
          <label className="welcome-check"><input type="checkbox" checked={s.ambience.kind !== 'off'} onChange={(e) => updateSettings({ ambience: { ...s.ambience, kind: e.target.checked ? 'auto' : 'off' } })} /><span><strong>Soft background sound while reading</strong><br /><small>Quiet, and matched to the book. Off any time in the reader.</small></span></label>
          <label className="welcome-check"><input type="checkbox" checked={s.keepAwake} onChange={(e) => updateSettings({ keepAwake: e.target.checked })} /><span><strong>Keep the screen awake while reading and praying</strong><br /><small>So the rosary does not dim in your hands.</small></span></label>
          <label className="welcome-check"><input type="checkbox" checked={s.hints} onChange={(e) => updateSettings({ hints: e.target.checked })} /><span><strong>Show red dots and short tips</strong><br /><small>A red dot marks things you have not opened yet; a tip explains a feature the first time.</small></span></label>
        </>}

        {i === 4 && <>
          <p className="welcome-sub">{s.interests.length ? 'Here is where we would start, from what you told us.' : 'Here are a few good places to start.'}</p>
          <ul className="welcome-start">
            {suggestions.map((f) => <li key={f.id}><Link to={f.to} data-seen={f.id} onClick={() => done()}><strong>{f.title}</strong><span>{f.blurb}</span></Link></li>)}
          </ul>
          <p className="welcome-sub">Red dots mark things you have not opened yet. Everything is also in <strong>Search</strong> and on the <strong>Everything</strong> page. You can change any choice in Settings.</p>
        </>}

        <div className="welcome-bar">
          {i > 0 ? <button className="btn" onClick={() => setI(i - 1)}>Back</button> : <button className="btn ghost" onClick={() => done()}>Skip setup</button>}
          <span className="welcome-right">
            {last && <button className="btn" onClick={() => done(true)}>Quick tour (1 min)</button>}
            {last ? <button className="btn primary" onClick={() => done()}>Start</button> : <button className="btn primary" onClick={() => setI(i + 1)}>{i === 0 && !s.interests.length ? 'Skip this' : 'Next'}</button>}
          </span>
        </div>
      </div>
    </div>
  );
}
