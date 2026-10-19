import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { downloadEdition, isEditionCached } from '../data/loader';
import { useSettings, type ThemeName } from '../lib/store';
import { BOOKS } from '../lib/canon';
import { NATIONS } from '../liturgy/litcal';
import { enableReminders, scheduleReminder } from '../liturgy/reminders';
import { deleteAllData, download, exportAll } from '../db/ops';

export default function SettingsPage() {
  const [s, set] = useSettings();
  const { editions } = useEditions();
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [prog, setProg] = useState<Record<string, string>>({});
  const [remMsg, setRemMsg] = useState('');
  useEffect(() => {
    editions.forEach((e) => isEditionCached(e.id, BOOKS.map((b) => b.id)).then((c) => setCached((x) => ({ ...x, [e.id]: c }))));
  }, [editions]);
  const dl = async (id: string) => {
    await downloadEdition(id, BOOKS.map((b) => b.id), (d, t) => setProg((p) => ({ ...p, [id]: `${d}/${t}` })));
    setProg((p) => ({ ...p, [id]: '' }));
    setCached((c) => ({ ...c, [id]: true }));
  };
  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="card">
        <h3>Reading</h3>
        <div className="row between" style={{ margin: '8px 0' }}><span>Default translation</span><select value={s.defaultEdition} onChange={(e) => set({ defaultEdition: e.target.value, last: null })} aria-label="Default translation">{editions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Theme</span><select value={s.theme} onChange={(e) => set({ theme: e.target.value as ThemeName })} aria-label="Theme">{['system', 'light', 'sepia', 'dark'].map((t) => <option key={t}>{t}</option>)}</select></div>
        <label className="row between" style={{ margin: '8px 0' }}><span>Text size ({s.fontSize}px)</span><input type="range" min={14} max={30} value={s.fontSize} onChange={(e) => set({ fontSize: +e.target.value })} /></label>
        <label className="row between" style={{ margin: '8px 0' }}><span>Line spacing ({s.lineHeight.toFixed(2)})</span><input type="range" min={1.3} max={2.2} step={0.05} value={s.lineHeight} onChange={(e) => set({ lineHeight: +e.target.value })} /></label>
        <div className="row between" style={{ margin: '8px 0' }}><span>Margins</span><select value={s.margin} onChange={(e) => set({ margin: e.target.value as any })}>{['narrow', 'normal', 'wide'].map((t) => <option key={t}>{t}</option>)}</select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Typed references (e.g. “Ps 23”) use</span><select value={s.refNumbering} onChange={(e) => set({ refNumbering: e.target.value as any })}><option value="edition">the numbering of the current translation</option><option value="english">English / Hebrew numbering</option><option value="vulgate">Vulgate / Douay numbering</option></select></div>
        <div className="row between" style={{ margin: '8px 0' }}><span>Liturgical calendar</span><select value={s.diocese} onChange={(e) => set({ diocese: e.target.value })}>{Object.entries(NATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </div>

      <div className="card">
        <h3>Offline reading</h3>
        <p className="muted small">Only public-domain editions can be downloaded. The app caches any chapter you open; use these buttons to fetch an entire edition (about 5 MB each) in advance.</p>
        {editions.map((e) => (
          <div className="row between" key={e.id} style={{ margin: '6px 0' }}>
            <span>{e.name}</span>
            {cached[e.id] ? <span className="chip good">available offline</span> : prog[e.id] ? <span className="chip">{prog[e.id]}</span> : <button className="btn small" disabled={!e.offlineAllowed} onClick={() => dl(e.id)}>Download</button>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Reminders (optional)</h3>
        <p className="muted small">Entirely under your control. They work while the app is open or installed; nothing is sent from a server and no tracking is involved.</p>
        <label className="row between" style={{ margin: '8px 0' }}><span>Remind me daily</span><input type="checkbox" checked={s.reminders.enabled} onChange={async (e) => { if (e.target.checked) { const r = await enableReminders(); setRemMsg(r === 'granted' ? 'Reminders enabled while the app is running.' : r === 'denied' ? 'Notification permission was denied in the browser.' : 'This browser does not support notifications.'); set({ reminders: { ...s.reminders, enabled: r === 'granted' } }); } else set({ reminders: { ...s.reminders, enabled: false } }); setTimeout(scheduleReminder, 50); }} /></label>
        <div className="row between" style={{ margin: '8px 0' }}><span>Time</span><input type="time" value={s.reminders.time} onChange={(e) => { set({ reminders: { ...s.reminders, time: e.target.value } }); setTimeout(scheduleReminder, 50); }} /></div>
        <input type="text" value={s.reminders.message} onChange={(e) => set({ reminders: { ...s.reminders, message: e.target.value } })} style={{ width: '100%' }} aria-label="Reminder message" />
        {remMsg && <p className="small">{remMsg}</p>}
        <label className="row between" style={{ margin: '12px 0 0' }}><span>Show “days in a row” on reading plans (off by default)</span><input type="checkbox" checked={s.showStreaks} onChange={(e) => set({ showStreaks: e.target.checked })} /></label>
      </div>

      <div className="card">
        <h3>Your data, sync and privacy</h3>
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
    </div>
  );
}
