import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { EnableEditionDialog, useChoosable } from '../components/EditionGate';
import { downloadEdition, isEditionCached, downloadPack, getManifest, type StudyPack } from '../data/loader';
import { useSettings, THEMES } from '../lib/store';
import { LANGS, useT } from '../lib/i18n';
import { BOOKS } from '../lib/canon';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder, PRESETS } from '../liturgy/reminders';
import { deleteAllData, download, exportAll } from '../db/ops';

export default function SettingsPage() {
  const [s, set] = useSettings();
  const { editions } = useEditions();
  const t = useT();
  const { choosable, off } = useChoosable();
  const [enabling, setEnabling] = useState<(typeof editions)[number] | null>(null);
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [prog, setProg] = useState<Record<string, string>>({});
  const [remMsg, setRemMsg] = useState('');
  useEffect(() => {
    editions.forEach((e) => isEditionCached(e.id, BOOKS.map((b) => b.id)).then((c) => setCached((x) => ({ ...x, [e.id]: c }))));
  }, [editions]);
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [packProg, setPackProg] = useState<Record<string, string>>({});
  useEffect(() => {
    getManifest().then((m) => setPacks(m?.packs ?? [])).catch(() => {});
  }, []);
  const dlPack = async (p: StudyPack) => {
    await downloadPack(p, (d, t) => setPackProg((x) => ({ ...x, [p.id]: `${d}/${t}` })));
    setPackProg((x) => ({ ...x, [p.id]: '' }));
  };
  const packDone = (id: string) => {
    try {
      return !!localStorage.getItem(`pack.${id}`);
    } catch {
      return false;
    }
  };
  const dl = async (id: string) => {
    await downloadEdition(id, BOOKS.map((b) => b.id), (d, t) => setProg((p) => ({ ...p, [id]: `${d}/${t}` })));
    setProg((p) => ({ ...p, [id]: '' }));
    setCached((c) => ({ ...c, [id]: true }));
  };
  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="card more-links">
        <Link to="/account">Account and sync</Link>
        <Link to="/study/sources">Sources and licensing</Link>
        <Link to="/about">About and feature status</Link>
      </div>
      <div className="card">
        <h2 className="card-title">Reading</h2>
        <div className="row between" style={{ margin: '8px 0' }}><span>{t('settings.language')}</span><select value={s.language} onChange={(e) => set({ language: e.target.value as any })} aria-label={t('settings.language')}>{LANGS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <p className="muted small" style={{ margin: '0 0 8px' }}>{t('settings.languageNote')}</p>
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
      </div>

      <div className="card">
        <h2 className="card-title">Offline reading</h2>
        <p className="muted small">Only public-domain editions can be downloaded. The app caches any chapter you open; use these buttons to fetch an entire edition (about 5 MB each) in advance.</p>
        {editions.map((e) => (
          <div className="row between" key={e.id} style={{ margin: '6px 0' }}>
            <span>{e.name}</span>
            {cached[e.id] ? <span className="chip good">available offline</span> : prog[e.id] ? <span className="chip">{prog[e.id]}</span> : <button className="btn small" disabled={!e.offlineAllowed} onClick={() => dl(e.id)}>Download</button>}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">Study data offline</h2>
        <p className="muted small">Commentary, the Fathers library and resource links are cached as you use them. Download a whole pack to have it before you go offline. Your notes, highlights, plans, memorization and progress are always stored on this device and work offline. Links to publisher websites, map tiles and the Bible in a Year audio still need a connection.</p>
        {packs.length > 0 && <div className="row" style={{ marginBottom: 6 }}><button className="btn small primary" onClick={async () => { for (const p of packs) if (!packDone(p.id)) await dlPack(p); }}>Download all study data ({(packs.reduce((n, p) => n + p.bytes, 0) / 1e6).toFixed(0)} MB)</button></div>}
        {packs.map((p) => (
          <div className="row between" key={p.id} style={{ margin: '6px 0' }}>
            <span>{p.label} <span className="muted small">({(p.bytes / 1e6).toFixed(1)} MB)</span></span>
            {packProg[p.id] ? <span className="chip">{packProg[p.id]}</span> : packDone(p.id) ? <span className="chip good">downloaded</span> : <button className="btn small" onClick={() => dlPack(p)}>Download</button>}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">Reminders (optional)</h2>
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
      </div>

      <div className="card">
        <h2 className="card-title">Your data, sync and privacy</h2>
        <ul className="small" style={{ lineHeight: 1.6 }}>
          <li><strong>Private by default.</strong> Notes, highlights, bookmarks, journal and progress are stored only in this browser (IndexedDB). They are not uploaded anywhere. There are no accounts and no analytics.</li>
          <li><strong>Sync.</strong> Multi-device sync is not enabled in this build. The code defines a <code>SyncAdapter</code> (src/db/sync.ts) and a recommended end-to-end-encrypted design; until a backend is connected, use Export/Import to move data between devices.</li>
          <li><strong>Backup.</strong> Export everything as JSON at any time (Library → Export). Clearing browser data erases local data, so export first.</li>
          <li><strong>Retention & deletion.</strong> Data stays until you delete it. “Delete all my data” below removes the local database; with a future account, deletion would also remove server copies.</li>
          <li><strong>Network use.</strong> Reading Scripture, notes and search work offline. The app contacts third parties only when you open an external link, play a Bible in a Year episode (Ascension’s servers), or load the liturgical calendar (LitCal).</li>
        </ul>
        <div className="row">
          <button className="btn" onClick={async () => download(`studybible-export-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())}>Export everything</button>
          <button className="btn danger" onClick={() => confirm('Delete ALL notes, highlights, bookmarks, journal entries and progress on this device? This cannot be undone.') && deleteAllData()}>Delete all my data</button>
        </div>
      </div>
      <p className="small"><Link to="/about">Feature status</Link> · <Link to="/study/sources">Sources & licensing</Link></p>
      {enabling && <EnableEditionDialog edition={enabling} onClose={() => setEnabling(null)} />}
    </div>
  );
}
