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
      <div className="row" style={{ margin: '0 0 6px', flexWrap: 'wrap', gap: 6 }}>
        <span className="muted small" style={{ width: '100%' }}>Comfort presets</span>
        {chip(false, 'Standard', () => set({ fontSize: 19, lineHeight: 1.65, fontFamily: 'serif', letterSpacing: 0, wordSpacing: 0, plainAlign: false, margin: 'normal' }))}
        {chip(false, 'Large print', () => set({ fontSize: 28, lineHeight: 1.8, fontFamily: 'hyperlegible', letterSpacing: 0.01, wordSpacing: 0.05, plainAlign: true, margin: 'wide' }))}
        {chip(false, 'Dyslexia-friendly', () => set({ fontSize: 22, lineHeight: 2, fontFamily: 'dyslexic', letterSpacing: 0.04, wordSpacing: 0.16, plainAlign: true, margin: 'wide' }))}
        {chip(false, 'Low vision (zen contrast, large)', () => set({ fontSize: 32, lineHeight: 1.9, fontFamily: 'hyperlegible', letterSpacing: 0.02, wordSpacing: 0.08, plainAlign: true, margin: 'wide', theme: 'zen', wordFx: false, motes: false, motion: 'none' }))}
      </div>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Text size</span>
        <input type="range" min={14} max={44} value={s.fontSize} onChange={(e) => set({ fontSize: +e.target.value })} aria-label="Font size" />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Line spacing</span>
        <input type="range" min={1.3} max={2.2} step={0.05} value={s.lineHeight} onChange={(e) => set({ lineHeight: +e.target.value })} aria-label="Line spacing" />
      </label>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Margins</span>
        <div className="chips">{(['narrow', 'normal', 'wide'] as const).map((m) => chip(s.margin === m, m, () => set({ margin: m })))}</div>
      </div>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Letter spacing</span>
        <input type="range" min={0} max={0.12} step={0.01} value={s.letterSpacing} onChange={(e) => set({ letterSpacing: +e.target.value })} aria-label="Letter spacing" />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Word spacing</span>
        <input type="range" min={0} max={0.4} step={0.02} value={s.wordSpacing} onChange={(e) => set({ wordSpacing: +e.target.value })} aria-label="Word spacing" />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Plain left-aligned lines, shorter measure</span>
        <input type="checkbox" checked={s.plainAlign} onChange={(e) => set({ plainAlign: e.target.checked })} aria-label="Plain left-aligned lines" />
      </label>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Typeface</span>
        <div className="chips">{([['serif', 'serif'], ['sans', 'sans'], ['hyperlegible', 'Atkinson Hyperlegible'], ['dyslexic', 'OpenDyslexic']] as const).map(([m, l]) => chip(s.fontFamily === m, l, () => set({ fontFamily: m })))}</div>
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
      <p className="muted small" style={{ margin: '0 0 6px' }}>Real recordings, played softly while you read. Nature sounds, gentle music, classical piano, plain chant and old hymn recordings (chant and hymns follow the Church’s season where we have a fitting one); each track’s source and licence are listed below.</p>
      <div className="chips">
        {([['off', 'Silence'], ['nature', 'Nature'], ['music', 'Soft music'], ['classical', 'Classical'], ['chant', 'Chant'], ['hymn', 'Hymns'], ['rain', 'Rain'], ['wind', 'Wind'], ['stream', 'Stream']] as const).map(([k, l]) => chip(s.ambience.kind === k, l, () => set({ ambience: { ...s.ambience, kind: k }, ambienceTipSeen: true })))}
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

      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Animation</span>
        <div className="chips">{([['full', 'Full'], ['calm', 'Calm'], ['none', 'Still']] as const).map(([m, l]) => chip(s.motion === m, l, () => set({ motion: m })))}</div>
      </div>
      <label className="row between" style={{ margin: '4px 0' }}>
        <span>Tiny vibration on taps (phones that support it)</span>
        <input type="checkbox" checked={s.haptics} onChange={(e) => { set({ haptics: e.target.checked }); if (e.target.checked && 'vibrate' in navigator) navigator.vibrate(15); }} aria-label="Haptic feedback" />
      </label>

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
