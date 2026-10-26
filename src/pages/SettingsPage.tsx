import Fold, { FoldControls } from '../components/Fold';
import { resetSeen, markAllSeen } from '../lib/seen';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSync } from '../sync/state';
import { useEditions } from '../data/EditionsContext';
import { EnableEditionDialog, useChoosable } from '../components/EditionGate';
import StorageStatus from '../components/StorageStatus';
import { useSettings, THEMES } from '../lib/store';
import { TRADITIONS, traditionOf } from '../lib/tradition';
import { LANGS, useT } from '../lib/i18n';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder, PRESETS } from '../liturgy/reminders';
import DriveBackup from '../components/DriveBackup';
import { deleteAllData, download, exportAll } from '../db/ops';

/** Timings the browser already keeps, shown only here. Nothing is sent anywhere. */
function PerfInfo() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const first = performance.getEntriesByName('sb-first-passage')[0];
  const ms = (n?: number) => (n === undefined ? 'not measured yet' : `${Math.round(n)} ms`);
  return (
    <ul className="small bullets">
      <li>First content on screen: {ms(fcp?.startTime)} after the page started loading.</li>
      <li>First Bible passage shown: {ms(first?.startTime)} (open a chapter to measure it).</li>
      <li>Page fully loaded: {ms(nav?.loadEventEnd)}.</li>
      <li>These come from your browser and stay on this device. We do not collect them.</li>
    </ul>
  );
}

export default function SettingsPage() {
  const [s, set] = useSettings();
  const sync = useSync();
  const { editions } = useEditions();
  const t = useT();
  const { choosable, off } = useChoosable();
  const [enabling, setEnabling] = useState<(typeof editions)[number] | null>(null);
  const [remMsg, setRemMsg] = useState('');
  return (
    <div className="page">
      <h1>Settings</h1>
      <input type="search" className="settings-search" placeholder="Find a setting (try “font”, “sound”, “offline”)" aria-label="Find a setting" onChange={(e) => { const q = e.target.value.trim().toLowerCase(); document.querySelectorAll<HTMLElement>('.page > .card').forEach((c) => { c.hidden = !!q && !(c.textContent ?? '').toLowerCase().includes(q) && !(c.querySelector('select,input') && [...c.querySelectorAll('[aria-label]')].some((n) => (n.getAttribute('aria-label') ?? '').toLowerCase().includes(q))); }); }} />
      <div className="card more-links">
        <Link to="/downloads">Downloads and offline</Link>
        {(sync.server === 'available' || sync.user) && <Link to="/account">Account and sync</Link>}
        <Link to="/study/sources">Sources and licensing</Link>
        <Link to="/about">About and feature status</Link>
      </div>
      <FoldControls />
      <Fold id="settings:Reading" title="Reading" open={true}>
        <div className="row between" style={{ margin: '8px 0' }}><span>{t('settings.language')}</span><select value={s.language} onChange={(e) => set({ language: e.target.value as any })} aria-label={t('settings.language')}>{LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <p className="muted small" style={{ margin: '0 0 8px' }}>{t('settings.languageNote')}</p>
        <div className="row between" style={{ margin: '8px 0' }}><span>Spelling</span><select value={s.spelling ?? 'us'} onChange={(e) => set({ spelling: e.target.value as 'us' | 'uk' })} aria-label="Spelling" data-keep-spelling><option value="us">US English (color)</option><option value="uk">British English (colour)</option></select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Default translation</span><select value={s.defaultEdition} onChange={(e) => set({ defaultEdition: e.target.value, last: null })} aria-label="Default translation">{choosable.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
        {off.length > 0 && <div className="row between" style={{ margin: '4px 0' }}><span className="muted small">Older translations are off by default: {off.map((e) => e.shortName).join(', ')}</span>{off.map((e) => <button key={e.id} className="btn small" onClick={() => setEnabling(e)}>Turn on {e.shortName}…</button>)}</div>}
        <div style={{ margin: '8px 0' }}>
          <div id="theme-label" style={{ marginBottom: 6 }}>Theme</div>
          <div role="radiogroup" aria-labelledby="theme-label" className="theme-grid">
            {THEMES.map(([k, l, bg, fg, ac]) => (
              <button key={k} role="radio" aria-checked={s.theme === k} className={'theme-swatch' + (s.theme === k ? ' on' : '')} onClick={() => set({ theme: k })}>
                <span className="theme-preview" style={{ background: bg, color: fg, borderColor: ac }} aria-hidden="true"><b>Aa</b><i style={{ background: ac }} /></span>
                <span>{l}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="row between" style={{ margin: '8px 0' }}><span>Text size ({s.fontSize}px)</span><input type="range" min={14} max={30} value={s.fontSize} onChange={(e) => set({ fontSize: +e.target.value })} /></label>
        <label className="row between" style={{ margin: '8px 0' }}><span>Line spacing ({s.lineHeight.toFixed(2)})</span><input type="range" min={1.3} max={2.2} step={0.05} value={s.lineHeight} onChange={(e) => set({ lineHeight: +e.target.value })} /></label>
        <div className="row between" style={{ margin: '8px 0' }}><span>Margins</span><select aria-label="Margins" value={s.margin} onChange={(e) => set({ margin: e.target.value as any })}>{['narrow', 'normal', 'wide'].map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Typed references (e.g. “Ps 23”) use</span><select aria-label="Numbering for typed references" value={s.refNumbering} onChange={(e) => set({ refNumbering: e.target.value as any })}><option value="edition">the numbering of the current translation</option><option value="english">English / Hebrew numbering</option><option value="vulgate">Vulgate / Douay numbering</option></select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Liturgical calendar</span><select aria-label="Liturgical calendar" value={s.diocese} onChange={(e) => set({ diocese: e.target.value })}>{Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </Fold>

      <Fold id="settings:Tips and red dots" title="Tips and red dots" open={false}>
        <label className="welcome-check"><input type="checkbox" checked={s.hints} onChange={(e) => set({ hints: e.target.checked })} /><span><strong>Show red dots and short tips</strong><br /><small>Dots mark things you have not opened; tips explain a feature once.</small></span></label>
        <div className="row-actions">
          <button className="btn" onClick={() => { resetSeen(); set({ hints: true }); }}>Show them all again</button>
          <button className="btn" onClick={() => markAllSeen()}>Clear every dot</button>
          <button className="btn" onClick={() => window.dispatchEvent(new Event('studybible:tour'))}>Take the short tour</button>
        </div>
      </Fold>
      <Fold id="settings:Your Church" title="Your Church" open={true}>
        <p className="muted small">The app began with the Latin (Roman) Rite. Choose your Church so it uses your own names (Divine Liturgy, Holy Qurbana…), shows the right calendar where it can, and says plainly where its readings and prayers follow the Roman Rite rather than yours.</p>
        <label className="row between" style={{ margin: '10px 0' }}>
          <span>I belong to</span>
          <select value={s.tradition} onChange={(e) => set({ tradition: e.target.value as any, refNumbering: traditionOf(e.target.value).roman ? s.refNumbering : 'vulgate' })} aria-label="Your Church">
            {TRADITIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {s.tradition === 'byzantine' && (
          <>
            <label className="row between"><span>Date Pascha by the Julian reckoning (as the Orthodox)</span><input type="checkbox" checked={s.paschaJulian} onChange={(e) => set({ paschaJulian: e.target.checked })} aria-label="Julian Pascha" /></label>
            <label className="row between"><span>Keep fixed feasts on the old calendar (13 days later)</span><input type="checkbox" checked={s.oldCalendar} onChange={(e) => set({ oldCalendar: e.target.checked })} aria-label="Old calendar" /></label>
          </>
        )}
        {!traditionOf(s.tradition).roman && <p className="small">Psalms are numbered here as in the Septuagint (and the Vulgate), the numbering your Church’s books use. {traditionOf(s.tradition).site && <>Your Church’s own site: <a href={traditionOf(s.tradition).site!.url} target="_blank" rel="noreferrer noopener">{traditionOf(s.tradition).site!.label}</a>.</>} See <Link to="/about#eastern">what the app does and does not cover for the Eastern Churches</Link>.</p>}
      </Fold>

      <StorageStatus />
      <details className="card">
        <summary><strong>Speed on this device</strong></summary>
        <PerfInfo />
      </details>


      <Fold id="settings:Reminders (optional)" title="Reminders (optional)" open={true}>
        <p className="muted small">Entirely under your control. They work while the app is open or installed; nothing is sent from a server and no tracking is involved.</p>
        <label className="row between" style={{ margin: '8px 0' }}><span>Remind me daily</span><input type="checkbox" checked={s.reminders.enabled} onChange={async (e) => { if (e.target.checked) { const r = await enableReminders(); setRemMsg(r === 'granted' ? 'Reminders enabled while the app is running.' : r === 'denied' ? 'Notification permission was denied in the browser.' : 'This browser does not support notifications.'); set({ reminders: { ...s.reminders, enabled: r === 'granted' } }); } else set({ reminders: { ...s.reminders, enabled: false } }); setTimeout(scheduleReminder, 50); }} /></label>
        <div className="row between" style={{ margin: '8px 0' }}><span>Time</span><input type="time" aria-label="Reminder time" value={s.reminders.time} onChange={(e) => { set({ reminders: { ...s.reminders, time: e.target.value } }); setTimeout(scheduleReminder, 50); }} /></div>
        <input type="text" value={s.reminders.message} onChange={(e) => set({ reminders: { ...s.reminders, message: e.target.value } })} style={{ width: '100%' }} aria-label="Reminder message" />
        {remMsg && <p className="small">{remMsg}</p>}
        <h3 style={{ marginTop: 14 }}>Prayer and verse reminders</h3>
        {s.prayerReminders.map((r) => (
          <div className="row between" key={r.id} style={{ margin: '6px 0' }}>
            <label className="row"><input type="checkbox" checked={r.enabled} onChange={async (e) => { if (e.target.checked && (await enableReminders()) !== 'granted') { setRemMsg('Notification permission is needed.'); return; } set({ prayerReminders: s.prayerReminders.map((x) => (x.id === r.id ? { ...x, enabled: e.target.checked } : x)) }); setTimeout(scheduleReminder, 50); }} /> {r.label}</label>
            <span className="row">
              <input type="time" value={r.time} aria-label={`${r.label} time`} onChange={(e) => { set({ prayerReminders: s.prayerReminders.map((x) => (x.id === r.id ? { ...x, time: e.target.value } : x)) }); setTimeout(scheduleReminder, 50); }} />
              <button className="btn small ghost" onClick={() => { set({ prayerReminders: s.prayerReminders.filter((x) => x.id !== r.id) }); setTimeout(scheduleReminder, 50); }} aria-label={`Remove ${r.label}`}>Remove</button>
            </span>
          </div>
        ))}
        <div className="row" style={{ marginTop: 6 }}>
          <span className="muted small">Add:</span>
          {PRESETS.filter((p) => !s.prayerReminders.some((r) => r.label === p.label)).map((p) => (
            <button key={p.label} className="btn small" onClick={() => set({ prayerReminders: [...s.prayerReminders, { id: `r-${Date.now()}`, label: p.label, time: p.time, message: p.message, enabled: false }] })}>{p.label}</button>
          ))}
        </div>
        <label className="row between" style={{ margin: '12px 0 0' }}><span>Show “days in a row” on reading plans (off by default)</span><input type="checkbox" checked={s.showStreaks} onChange={(e) => set({ showStreaks: e.target.checked })} /></label>
      </Fold>

      <DriveBackup />

      <Fold id="settings:Your data, sync and privacy" title="Your data, sync and privacy" open={false}>
        <ul className="small" style={{ lineHeight: 1.6 }}>
          <li><strong>Private by default.</strong> Notes, highlights, bookmarks, journal and progress are stored in this browser (IndexedDB) and nowhere else, and there are no analytics. Nothing leaves your device unless you turn on Google Drive backup or sign in to a sync server.</li>
          <li><strong>Accounts and sync are optional.</strong> If you or someone you trust runs a sync server, Account lets you sign in and sync across devices. That server can read what it stores: sync is not end-to-end encrypted. If no server is reachable here, everything keeps working locally. Use Google Drive backup or Export/Import to move data between devices without a server.</li>
          <li><strong>Backup.</strong> Connect Google Drive above for automatic backups, or export everything as JSON at any time (Library → Export). Clearing browser data erases local data, so back up first.</li>
          <li><strong>Retention & deletion.</strong> Data stays until you delete it. “Delete all my data” below removes the local database; if you use a sync server, deleting your account there also removes its copies.</li>
          <li><strong>Network use.</strong> Reading Scripture, notes and search work offline. The app contacts third parties only when you open an external link, play a Bible in a Year episode (Ascension’s servers), or load the liturgical calendar (LitCal).</li>
        </ul>
        <div className="row">
          <button className="btn" onClick={async () => download(`studybible-export-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())}>Export everything</button>
          <button className="btn danger" onClick={() => confirm('Delete ALL notes, highlights, bookmarks, journal entries and progress on this device? This cannot be undone.') && deleteAllData()}>Delete all my data</button>
        </div>
      </Fold>
      <p className="small"><Link to="/about">Feature status</Link> · <Link to="/study/sources">Sources & licensing</Link></p>
      {enabling && <EnableEditionDialog edition={enabling} onClose={() => setEnabling(null)} />}
    </div>
  );
}
