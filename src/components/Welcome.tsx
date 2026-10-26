import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, updateSettings, useSettings } from '../lib/store';
import { TRADITIONS } from '../lib/tradition';
import { LANGS } from '../lib/i18n';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder } from '../liturgy/reminders';
import { startHere } from '../lib/features';
import { BRAND } from '../lib/brand';
import FavoritesPicker from './FavoritesPicker';
import { saveBackupFile } from '../lib/safety';
import { db } from '../db/db';
import { choosePlan } from '../lib/activePlan';
import { signIn, signUp, useSync } from '../sync/state';
import { connect as connectDrive, driveAvailable } from '../sync/drive';

const DONE = 'sb:tour';
export const SETUP_KEY = 'sb:setup';
export const SETUP_VERSION = '2';
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
const STEPS = ['What brings you here?', 'Your learning and reading', 'Your Church and look', 'Your favorites', 'Your daily rhythm', 'Keep your notes safe', 'You’re set'];

/** The setup: a few short steps that tailor the app to the reader and make sure their writing is kept safe. Everyone sees it once (existing readers too), and every choice can be changed later in Settings. */
export default function Welcome() {
  const [on, setOn] = useState(() => get(SETUP_KEY) !== SETUP_VERSION);
  const [i, setI] = useState(0);
  const [s] = useSettings();
  const sync = useSync();
  const [remMsg, setRemMsg] = useState('');
  const [warn, setWarn] = useState(false);
  const [ack, setAck] = useState(false);
  const [mode, setMode] = useState<'up' | 'in'>('up');
  const [acct, setAcct] = useState({ email: '', pw: '', name: '' });
  const [busy, setBusy] = useState('');
  const [safeMsg, setSafeMsg] = useState('');
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => { if (on) { updateSettings({ ambienceTipSeen: true }); void navigator.storage?.persist?.(); } }, [on]);
  useEffect(() => { card.current?.focus(); setWarn(false); }, [i]);
  if (!on) return null;
  const done = (tour = false) => {
    put(DONE, '1'); put('sb:welcomed', '1'); put(SETUP_KEY, SETUP_VERSION); put('sb:whatsNew', '2026-10b');
    updateSettings({ onboarded: true });
    setOn(false);
    if (tour) window.setTimeout(() => window.dispatchEvent(new Event('studybible:tour')), 250);
  };
  const toggleInterest = (id: string) => updateSettings({ interests: s.interests.includes(id) ? s.interests.filter((x) => x !== id) : [...s.interests, id] });
  const last = i === STEPS.length - 1;
  const SAFE = STEPS.indexOf('Keep your notes safe');
  const suggestions = startHere(null, s.interests, 3);
  const guarded = [sync.user ? 'account' : '', s.drive.connected ? 'Google Drive' : '', s.lastBackup ? 'backup file' : ''].filter(Boolean);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy('One moment…'); setSafeMsg('');
    try {
      const decide = async () => 'merge' as const;
      if (mode === 'up') await signUp(acct.email.trim(), acct.pw, acct.name.trim() || undefined, decide); else await signIn(acct.email.trim(), acct.pw, decide);
    } catch (er) { setSafeMsg((er as Error).message || 'That did not work.'); }
    setBusy('');
  };
  const next = () => { if (i === SAFE && !guarded.length && !ack) { setWarn(true); return; } setI(i + 1); };
  return (
    <div className="welcome-layer" role="dialog" aria-modal="true" aria-label={`Set up ${BRAND.name}`}>
      <div className="welcome-card" ref={card} tabIndex={-1}>
        <div className="welcome-dots" aria-hidden>{STEPS.map((_, n) => <i key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />)}</div>
        <p className="welcome-step">{i === 0 ? 'Welcome' : `Step ${i + 1} of ${STEPS.length}`}</p>
        <h1 className="welcome-title">{STEPS[i]}</h1>

        {i === 0 && <>
          <p className="welcome-sub">Pick anything that fits. We will put those things first, and nothing is ever locked away. About two minutes.</p>
          <div className="welcome-chips" role="group" aria-label="What brings you here">
            {INTERESTS.map(([id, label, d]) => (
              <button key={id} className={`welcome-chip${s.interests.includes(id) ? ' on' : ''}`} aria-pressed={s.interests.includes(id)} onClick={() => toggleInterest(id)}>
                <strong>{label}</strong><span>{d}</span>
              </button>
            ))}
          </div>
        </>}

        {i === 1 && <>
          <p className="welcome-sub">So that you are not shown lessons made for ten-year-olds if you are an adult, and so your reading plan is ready the first time you open the Bible.</p>
          <h3 className="welcome-h">Who is the Catechism program for?</h3>
          <div className="welcome-chips" role="group" aria-label="Who is learning">
            {([['adult', 'Me, an adult', 'Adult lessons first; the K–12 grades stay a tap away'], ['youth', 'A student', 'Lessons by grade'], ['parent', 'My children', 'Lessons to do at home, by grade'], ['teacher', 'My class', 'Teacher guides, slides and games']] as [typeof s.audience, string, string][]).map(([id, label, d]) => (
              <button key={id} className={`welcome-chip${s.audience === id ? ' on' : ''}`} aria-pressed={s.audience === id} onClick={() => updateSettings({ audience: id })}>
                <strong>{label}</strong><span>{d}</span>
              </button>
            ))}
          </div>
          <h3 className="welcome-h">Follow a Bible reading plan?</h3>
          <div className="welcome-chips" role="group" aria-label="Reading plan">
            {([['', 'Not now', 'You can pick one later in Pray, then Plans'], ['biay', 'Bible in a Year', 'Read and listen with Fr. Mike Schmitz'], ['gospels-30', 'The four Gospels in 30 days', 'About three chapters a day'], ['nt-90', 'New Testament in 90 days', 'Three chapters a day'], ['john-21', 'John in 21 days', 'One chapter a day']] as [string, string, string][]).map(([id, label, d]) => (
              <button key={id || 'none'} className={`welcome-chip${s.activePlan === id ? ' on' : ''}`} aria-pressed={s.activePlan === id} onClick={async () => {
                if (id) { const have = await db.planProgress.get(id); if (!have) await db.planProgress.put({ planId: id, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 }); }
                choosePlan(id);
              }}>
                <strong>{label}</strong><span>{d}</span>
              </button>
            ))}
          </div>
          <label className="welcome-row"><span>Weekly goal</span>
            <select value={s.weeklyGoal} onChange={(e) => updateSettings({ weeklyGoal: +e.target.value })} aria-label="Chapters to read each week">
              <option value={0}>No goal</option>{[3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n} chapters a week</option>)}
            </select></label>
        </>}

        {i === 2 && <>
          <p className="welcome-sub">This sets the calendar, the readings and what you see first.</p>
          <label className="welcome-row"><span>Your Church</span>
            <select value={s.tradition} onChange={(e) => updateSettings({ tradition: e.target.value as typeof s.tradition })} aria-label="Your Church">{TRADITIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="welcome-row"><span>Calendar and holy days</span>
            <select value={s.diocese} onChange={(e) => updateSettings({ diocese: e.target.value })} aria-label="Liturgical calendar">{Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="welcome-row"><span>Language</span>
            <select value={s.language} onChange={(e) => updateSettings({ language: e.target.value as typeof s.language })} aria-label="Language">{LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <div className="welcome-row"><span>Text size</span>
            <span className="tour-switch" role="group" aria-label="Text size"><button onClick={() => updateSettings({ fontSize: Math.max(14, s.fontSize - 2) })} aria-label="Smaller text">A−</button><span className="tour-size">{s.fontSize}</span><button onClick={() => updateSettings({ fontSize: Math.min(32, s.fontSize + 2) })} aria-label="Larger text">A+</button></span></div>
          <h3 className="welcome-h">Color</h3>
          <div className="qs-themes" role="group" aria-label="Color theme">
            {THEMES.map(([k, l, bg, fg, ac]) => (
              <button key={k} className={`qs-theme${s.theme === k ? ' on' : ''}`} aria-pressed={s.theme === k} onClick={() => updateSettings({ theme: k })} title={l}>
                <span className="qs-sw" style={{ background: bg, color: fg, borderColor: ac }}><b style={{ background: ac }} />Aa</span>
                <small>{l.replace(' (default)', '')}</small>
              </button>
            ))}
          </div>
          <p className="welcome-preview" style={{ fontSize: s.fontSize }}>In the beginning was the Word, and the Word was with God, and the Word was God.</p>
        </>}

        {i === 3 && <>
          <p className="welcome-sub">Choose podcasts, audiobooks and video creators you like. Media puts them first. Skip it and everything is still there, with the Bible in a Year first.</p>
          <FavoritesPicker compact />
        </>}

        {i === 4 && <>
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

        {i === SAFE && !warn && <>
          <p className="welcome-sub">Your notes, highlights, prayer list and progress are saved on this device. Keep a second copy so they cannot be lost.</p>
          <div className="safe-list">
            {(sync.user || sync.server === 'available') && (            <section className={`safe-card${sync.user ? ' ok' : ''}`}>
              <h2>Account {sync.user && '✓'}</h2>
              {sync.user ? <p className="small">Signed in as <strong>{sync.user.email}</strong>. Your notes sync and are kept on the server.</p>
                : sync.server === 'available' ? (
                  <form onSubmit={submit}>
                    <div className="segmented" role="tablist"><button type="button" role="tab" aria-selected={mode === 'up'} disabled={sync.registration === 'closed'} onClick={() => setMode('up')}>Create account</button><button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => setMode('in')}>Sign in</button></div>
                    <label className="welcome-row"><span>Email</span><input type="email" required value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value })} autoComplete="email" aria-label="Email" /></label>
                    <label className="welcome-row"><span>Password</span><input type="password" required minLength={mode === 'up' ? 10 : 1} value={acct.pw} onChange={(e) => setAcct({ ...acct, pw: e.target.value })} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} aria-label="Password" /></label>
                    {mode === 'up' && <p className="muted small">At least 10 characters. A short phrase is easier to remember and stronger than a clever word.</p>}
                    <button className="btn primary" disabled={!!busy}>{busy || (mode === 'up' ? 'Create account' : 'Sign in')}</button>
                  </form>
                ) : sync.server === 'unknown' ? <p className="small muted">Looking for the sync server…</p>
                : null}
              {safeMsg && <p className="small" role="alert">{safeMsg}</p>}
            </section>)}
            {driveAvailable() && <section className={`safe-card${s.drive.connected ? ' ok' : ''}`}><h2>Google Drive {s.drive.connected && '✓'}</h2>
              <p className="small">A private app folder in your own Drive, kept up to date by itself.</p>
              {!s.drive.connected && <button className="btn" onClick={async () => { try { await connectDrive(); setSafeMsg(''); } catch (er) { setSafeMsg((er as Error).message); } }}>Back up to Google Drive</button>}</section>}
            <section className={`safe-card${s.lastBackup ? ' ok' : ''}`}><h2>A backup file {s.lastBackup ? '✓' : ''}</h2>
              <p className="small">One tap saves everything as a file you can keep in Files, iCloud, Drive or email. We will remind you every two weeks.</p>
              <button className="btn" onClick={async () => { try { await saveBackupFile(); setSafeMsg(''); } catch { /* cancelled */ } }}>{s.lastBackup ? 'Save another' : 'Save a backup file'}</button></section>
            <p className="muted small">Also on, automatically: a safety copy on this device each day, and a request to the browser not to clear your data.</p>
          </div>
        </>}
        {i === SAFE && warn && (
          <div className="safe-warn" role="alertdialog" aria-label="Continue without protection?">
            <h2>Continue without protection?</h2>
            <p>Without an account, a Google Drive backup or a saved backup file, your notes, highlights, prayer list and progress exist <strong>only in this browser on this device</strong>.</p>
            <p>If you clear your browsing data, switch or lose your phone, reinstall the browser, or the browser frees up space, they will be <strong>gone for good</strong>. Nobody, including us, will be able to get them back.</p>
            <label className="welcome-check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /><span>I understand that my data may be lost with no way to recover it.</span></label>
            <div className="row" style={{ gap: 8 }}><button className="btn primary" onClick={() => setWarn(false)}>Go back and protect my notes</button><button className="btn" disabled={!ack} onClick={() => { setWarn(false); setI(i + 1); }}>Continue without protection</button></div>
          </div>
        )}

        {last && <>
          <p className="welcome-sub">{s.interests.length ? 'Here is where we would start, from what you told us.' : 'Here are a few good places to start.'}</p>
          <ul className="welcome-start">
            {suggestions.map((f) => <li key={f.id}><Link to={f.to} data-seen={f.id} onClick={() => done()}><strong>{f.title}</strong><span>{f.blurb}</span></Link></li>)}
          </ul>
          <p className="welcome-sub">A short tour comes next: about a minute, and you can skip it. Red dots mark things you have not opened yet. Everything is also in <strong>Search</strong> and on the <strong>Everything</strong> page, and every choice can be changed in Settings.</p>
        </>}

        {!(i === SAFE && warn) && <div className="welcome-bar">
          {i > 0 ? <button className="btn" onClick={() => setI(i - 1)}>Back</button> : <span />}
          <span className="welcome-right">
            {last ? <><button className="btn" onClick={() => done(false)}>Skip the tour</button><button className="btn primary" onClick={() => done(true)}>Start the tour</button></>
              : <button className="btn primary" onClick={next}>{i === 0 && !s.interests.length ? 'Skip this' : i === SAFE && !guarded.length ? 'Continue' : 'Next'}</button>}
          </span>
        </div>}
      </div>
    </div>
  );
}
