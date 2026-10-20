import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSettings, THEMES, type ThemeName } from '../lib/store';
import { startQuiet } from '../lib/quiet';
import { loadTracks, onTrack, type Track } from '../lib/ambience';

/** How I read: text, theme, atmosphere, sound and silent mode, in one place. */
export default function TextSettings({ onClose }: { onClose: () => void }) {
  const [s, set] = useSettings();
  const [minutes, setMinutes] = useState(20);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [now, setNow] = useState<Track | null>(null);
  useEffect(() => { loadTracks().then(setTracks); return onTrack(setNow); }, []);
  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} className={`chip${on ? ' sel' : ''}`} onClick={onClick} aria-pressed={on}>{label}</button>
  );
  return (
    <Modal title="Reading settings" onClose={onClose}>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Text size</span>
        <input type="range" min={14} max={30} value={s.fontSize} onChange={(e) => set({ fontSize: +e.target.value })} aria-label="Font size" />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Line spacing</span>
        <input type="range" min={1.3} max={2.2} step={0.05} value={s.lineHeight} onChange={(e) => set({ lineHeight: +e.target.value })} aria-label="Line spacing" />
      </label>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Margins</span>
        <div className="chips">{(['narrow', 'normal', 'wide'] as const).map((m) => chip(s.margin === m, m, () => set({ margin: m })))}</div>
      </div>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Typeface</span>
        <div className="chips">{(['serif', 'sans'] as const).map((m) => chip(s.fontFamily === m, m, () => set({ fontFamily: m })))}</div>
      </div>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Theme</span>
        <select value={s.theme} onChange={(e) => set({ theme: e.target.value as ThemeName })} aria-label="Theme">
          {THEMES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Verse numbers</span>
        <input type="checkbox" checked={s.showVerseNumbers} onChange={(e) => set({ showVerseNumbers: e.target.checked })} />
      </label>

      <h3 className="modal-sub">Atmosphere</h3>
      <p className="muted small" style={{ margin: '0 0 6px' }}>A soft backdrop that suits the book, and for a few passages the moment (desert light, a storm sky for Job, dawn for the Resurrection). Only the background changes.</p>
      <div className="chips">
        {chip(s.atmosphere === 'off', 'Off', () => set({ atmosphere: 'off' }))}
        {chip(s.atmosphere === 'book', 'By book', () => set({ atmosphere: 'book' }))}
        {chip(s.atmosphere === 'passage', 'By book and passage', () => set({ atmosphere: 'passage' }))}
      </div>

      <h3 className="modal-sub">Sound</h3>
      <p className="muted small" style={{ margin: '0 0 6px' }}>Real recordings, played softly while you read. Nature sounds, gentle music, classical piano and plain chant; each track’s source and licence are listed below.</p>
      <div className="chips">
        {([['off', 'Silence'], ['nature', 'Nature'], ['music', 'Soft music'], ['classical', 'Classical'], ['chant', 'Chant'], ['rain', 'Rain'], ['wind', 'Wind'], ['stream', 'Stream']] as const).map(([k, l]) => chip(s.ambience.kind === k, l, () => set({ ambience: { ...s.ambience, kind: k }, ambienceTipSeen: true })))}
      </div>
      {now && s.ambience.kind !== 'off' && <p className="small muted" style={{ margin: '6px 0 0' }}>Now playing: {now.title}{now.artist ? `, ${now.artist}` : ''} · {now.sourceUrl ? <a href={now.sourceUrl} target="_blank" rel="noreferrer">{now.license}</a> : now.license}</p>}
      {s.ambience.kind !== 'off' && (
        <>
          <label className="row between" style={{ margin: '10px 0' }}>
            <span>Volume</span>
            <input type="range" min={0.05} max={0.6} step={0.05} value={s.ambience.volume} onChange={(e) => set({ ambience: { ...s.ambience, volume: +e.target.value } })} aria-label="Ambience volume" />
          </label>
          <label className="row between" style={{ margin: '6px 0' }}>
            <span>Let the passage choose the sound where it suits</span>
            <input type="checkbox" checked={s.ambience.match} onChange={(e) => set({ ambience: { ...s.ambience, match: e.target.checked } })} />
          </label>
        </>
      )}

      <label className="row between" style={{ margin: '10px 0 4px' }}>
        <span>Drifting light behind the text</span>
        <input type="checkbox" checked={s.motes} onChange={(e) => set({ motes: e.target.checked })} aria-label="Soft moving light" />
      </label>
      <label className="row between" style={{ margin: '4px 0' }}>
        <span>Sparkle on key words (tap for what they mean)</span>
        <input type="checkbox" checked={s.sparkles} onChange={(e) => set({ sparkles: e.target.checked })} aria-label="Sparkling key words" />
      </label>
      <label className="row between" style={{ margin: '4px 0' }}>
        <span>Let words act out their meaning (fire flickers, water ripples, light glows)</span>
        <input type="checkbox" checked={s.wordFx} onChange={(e) => set({ wordFx: e.target.checked })} aria-label="Words that act out their meaning" />
      </label>
      <label className="row between" style={{ margin: '4px 0' }}>
        <span>Paintings of the scene, inline</span>
        <input type="checkbox" checked={s.inlineArt} onChange={(e) => set({ inlineArt: e.target.checked })} aria-label="Inline paintings" />
      </label>
      <details className="small" style={{ margin: '6px 0' }}>
        <summary>Sound credits and licences</summary>
        <ul className="list">{tracks.map((t) => <li key={t.id}>{t.title}{t.artist ? ` — ${t.artist}` : ''} · {t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noreferrer">{t.license}</a> : t.license}{t.note ? `. ${t.note}` : ''}</li>)}</ul>
      </details>

      <h3 className="modal-sub">Silent mode</h3>
      <label className="row between" style={{ margin: '6px 0' }}>
        <span>Only the text: no study panel, markers, prompts or progress</span>
        <input type="checkbox" checked={s.scriptureOnly} onChange={(e) => set({ scriptureOnly: e.target.checked })} aria-label="Silent mode" />
      </label>
      <div className="row between" style={{ margin: '12px 0 4px' }}>
        <span>Quiet reading session</span>
        <div className="chips">
          {[0, 10, 20, 30].map((m) => chip(minutes === m, m === 0 ? 'No timer' : `${m} min`, () => setMinutes(m)))}
        </div>
      </div>
      <button
        className="btn primary"
        onClick={() => {
          set({ scriptureOnly: true });
          startQuiet(minutes);
          onClose();
        }}
      >
        Begin a quiet reading session
      </button>
      <p className="muted small">Silent mode on, with your sound and a soft bell when the time is up. No streaks, counts or notifications.</p>
    </Modal>
  );
}
