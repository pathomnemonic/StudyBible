import { useId, useState } from 'react';
import { download } from '../db/ops';
import { copyText } from '../lib/clipboard';
import { applyPlace, collectPlace, describePlace, placeToCode, readPlace, SECTION_NAMES, type Place, type Section } from '../lib/movePlace';

/** A small way to change phones without an account: save your place, then bring it in on the new device. Never overwrites without asking. */
export default function MovePlace() {
  const id = useId();
  const [code, setCode] = useState('');
  const [paste, setPaste] = useState('');
  const [found, setFound] = useState<Place | null>(null);
  const [pick, setPick] = useState<Set<Section>>(new Set());
  const [msg, setMsg] = useState('');
  const say = (m: string) => setMsg(m);

  const check = async (text: string) => {
    try {
      const p = await readPlace(text);
      const rows = describePlace(p);
      if (!rows.length) { say('That file has nothing in it to bring over.'); return; }
      setFound(p); setPick(new Set(rows.map((r) => r.section))); say('');
    } catch (e) { setFound(null); say((e as Error).message); }
  };
  const rows = found ? describePlace(found) : [];
  return (
    <div className="card mp-card">
      <h3>Move my place</h3>
      <p className="muted small">Changing phones? This carries your reading plan position, memorized verses, Slow Bible progress, passport stamps, game streaks and trophies, stickers, favorite days and setup choices. No account. It does not hold notes or highlights: use the full backup file for those.</p>
      <div className="btn-row">
        <button className="btn primary" onClick={async () => { const p = await collectPlace(); download(`studybible-place-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(p)); say('Saved. Open the same page on your new device and choose this file.'); }}>Save my place as a file</button>
        <button className="btn" onClick={async () => { const c = await placeToCode(await collectPlace()); setCode(c); say(''); }}>Make a code to copy</button>
      </div>
      {code && (
        <div>
          <label htmlFor={`${id}-code`} className="small">Your code ({code.length.toLocaleString()} characters)</label>
          <textarea id={`${id}-code`} readOnly rows={3} value={code} style={{ width: '100%' }} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn small" onClick={async () => say((await copyText(code)) ? 'Code copied.' : 'Select the code and copy it by hand.')}>Copy the code</button>
        </div>
      )}
      <h4>Bring my place here</h4>
      <label className="btn small mp-file">Choose a place file<input type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await check(await f.text()); }} /></label>
      <label htmlFor={`${id}-paste`} className="small" style={{ display: 'block', marginTop: 8 }}>Or paste a code</label>
      <textarea id={`${id}-paste`} rows={2} value={paste} onChange={(e) => setPaste(e.target.value)} style={{ width: '100%' }} placeholder="SBP1.…" />
      <button className="btn small" disabled={!paste.trim()} onClick={() => void check(paste)}>Check the code</button>
      {found && (
        <fieldset className="mp-found">
          <legend>Found in this place. Choose what to merge into this device.</legend>
          {rows.map((r) => (
            <label key={r.section} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={pick.has(r.section)} onChange={(e) => setPick((s) => { const n = new Set(s); if (e.target.checked) n.add(r.section); else n.delete(r.section); return n; })} />
              <span><strong>{SECTION_NAMES[r.section]}</strong> <span className="muted small">{r.text}</span></span>
            </label>
          ))}
          <p className="muted small">Merging adds what is missing and keeps what this device already has. Only “Setup choices” replaces things, so untick it to keep your current look.</p>
          <div className="btn-row">
            <button className="btn primary" disabled={!pick.size} onClick={async () => { try { const d = await applyPlace(found, [...pick]); say(`Merged: ${d.join('; ')}.`); setFound(null); setPaste(''); } catch (e) { say((e as Error).message); } }}>Merge into this device</button>
            <button className="btn" onClick={() => setFound(null)}>Cancel</button>
          </div>
        </fieldset>
      )}
      {msg && <p className="small" role="status">{msg}</p>}
    </div>
  );
}
