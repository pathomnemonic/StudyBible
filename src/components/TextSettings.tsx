import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSettings, THEMES, DEFAULTS, type ThemeName } from '../lib/store';
import { startQuiet } from '../lib/quiet';
import { loadTracks, onTrack, type Track } from '../lib/ambience';

const NATURE = ['nature', 'rain', 'wind', 'stream', 'sea', 'desert', 'night', 'fire', 'thunder', 'pasture', 'crowd'];

/** How I read: text, theme, atmosphere, sound and focus mode, in one place. */
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
      <div style={{ margin: '0 0 6px' }}><button className="btn" onClick={() => set({ theme: DEFAULTS.theme, fontSize: DEFAULTS.fontSize, lineHeight: DEFAULTS.lineHeight, fontFamily: DEFAULTS.fontFamily, letterSpacing: DEFAULTS.letterSpacing, wordSpacing: DEFAULTS.wordSpacing, plainAlign: DEFAULTS.plainAlign, margin: DEFAULTS.margin, motion: DEFAULTS.motion, wordFx: DEFAULTS.wordFx, redLetters: DEFAULTS.redLetters, motes: DEFAULTS.motes })}>Reset reading look to the original</button></div>
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
        <span>Show minutes left and progress while reading</span>
        <input type="checkbox" checked={s.readProgress} onChange={(e) => set({ readProgress: e.target.checked })} aria-label="Reading progress" />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Verse numbers</span>
        <input type="checkbox" checked={s.showVerseNumbers} onChange={(e) => set({ showVerseNumbers: e.target.checked })} />
      </label>

      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Moving between chapters</span>
        <div className="chips">{chip(s.scrollMode === 'pages', 'One at a time', () => set({ scrollMode: 'pages' }))}{chip(s.scrollMode === 'infinite', 'Keep scrolling', () => set({ scrollMode: 'infinite' }))}</div>
      </div>

      <h3 className="modal-sub">Atmosphere</h3>
      <p className="muted small" style={{ margin: '0 0 6px' }}>A soft backdrop that suits the book, and for a few passages the moment (desert light, a storm sky for Job, dawn for the Resurrection). Only the background changes.</p>
      <div className="chips">
        {chip(s.atmosphere === 'off', 'Off', () => set({ atmosphere: 'off' }))}
        {chip(s.atmosphere === 'book', 'By book', () => set({ atmosphere: 'book' }))}
        {chip(s.atmosphere === 'passage', 'By book and passage', () => set({ atmosphere: 'passage' }))}
      </div>

      <h3 className="modal-sub">Sound</h3>
      <p className="muted small" style={{ margin: '0 0 8px' }}>Real recordings, played softly while you read. Off until you choose.</p>
      <button className={`auto-pick${s.ambience.kind === 'auto' ? ' sel' : ''}`} aria-pressed={s.ambience.kind === 'auto'} onClick={() => set({ ambience: { ...s.ambience, kind: 'auto' }, ambienceTipSeen: true })}>
        <strong>Choose for me <span className="rec">Recommended</span></strong>
        <span>A quiet sound that suits what you are reading: gentle water, wind, sea or night. Never loud, never sudden, and it changes with the book.</span>
      </button>
      <div className="chips" style={{ marginTop: 8 }}>
        {chip(s.ambience.kind === 'off', 'Off', () => set({ ambience: { ...s.ambience, kind: 'off' }, ambienceTipSeen: true }))}
        {chip(NATURE.includes(s.ambience.kind), 'Nature', () => set({ ambience: { ...s.ambience, kind: NATURE.includes(s.ambience.kind) ? s.ambience.kind : 'nature' }, ambienceTipSeen: true }))}
        {([['music', 'Soft music'], ['classical', 'Piano'], ['chant', 'Chant'], ['hymn', 'Hymns']] as const).map(([k, l]) => chip(s.ambience.kind === k, l, () => set({ ambience: { ...s.ambience, kind: k }, ambienceTipSeen: true })))}
      </div>
      {NATURE.includes(s.ambience.kind) && (
        <div className="subchoice">
          <span className="muted small">Which nature sound?</span>
          <div className="chips">
            {([['nature', 'A mix'], ['rain', 'Rain'], ['stream', 'Stream'], ['wind', 'Wind in trees'], ['sea', 'Sea waves'], ['night', 'Night crickets'], ['desert', 'Desert wind'], ['pasture', 'Pasture'], ['fire', 'Fire'], ['thunder', 'Thunder']] as const).map(([k, l]) => chip(s.ambience.kind === k, l, () => set({ ambience: { ...s.ambience, kind: k }, ambienceTipSeen: true })))}
          </div>
        </div>
      )}
      {now && s.ambience.kind !== 'off' && <p className="small muted" style={{ margin: '6px 0 0' }}>Now playing: {now.title}{now.artist ? `, ${now.artist}` : ''} · {now.sourceUrl ? <a href={now.sourceUrl} target="_blank" rel="noreferrer">{now.license}</a> : now.license}</p>}
      {s.ambience.kind !== 'off' && (
        <>
          <label className="row between" style={{ margin: '10px 0' }}>
            <span>Volume{s.ambience.kind === 'auto' ? ' (kept low)' : ''}</span>
            <input type="range" min={0.05} max={s.ambience.kind === 'auto' ? 0.2 : 0.6} step={0.05} value={Math.min(s.ambience.volume, s.ambience.kind === 'auto' ? 0.2 : 0.6)} onChange={(e) => set({ ambience: { ...s.ambience, volume: +e.target.value } })} aria-label="Ambience volume" />
          </label>
          {s.ambience.kind !== 'auto' && (
            <label className="row between" style={{ margin: '6px 0' }}>
              <span>Let the passage choose the sound where it suits</span>
              <input type="checkbox" checked={s.ambience.match} onChange={(e) => set({ ambience: { ...s.ambience, match: e.target.checked } })} />
            </label>
          )}
        </>
      )}

      <label className="row between" style={{ margin: '10px 0 4px' }}>
        <span>Slowly drifting colour behind the text</span>
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
        <span>Words of Jesus in red</span>
        <input type="checkbox" checked={s.redLetters} onChange={(e) => set({ redLetters: e.target.checked })} aria-label="Words of Jesus in red" />
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

      <h3 className="modal-sub">Focus mode</h3>
      <label className="row between" style={{ margin: '6px 0' }}>
        <span>Just the text: no study panel, prompts or progress</span>
        <input type="checkbox" checked={s.scriptureOnly} onChange={(e) => set({ scriptureOnly: e.target.checked })} aria-label="Focus mode" />
      </label>
      <details className="small" style={{ margin: '6px 0' }} open>
        <summary>What focus mode means for you</summary>
        {([['scroll', 'Keep scrolling from chapter to chapter, with no buttons between them'], ['numbers', 'Show verse numbers'], ['markers', 'Show the small counts of notes beside verses'], ['art', 'Show paintings of the scene'], ['effects', 'Let words act out their meaning'], ['sparkles', 'Sparkle on key words'], ['sound', 'Keep the reading sound playing']] as const).map(([k, l]) => (
          <label key={k} className="row between" style={{ margin: '4px 0' }}>
            <span>{l}</span>
            <input type="checkbox" checked={s.focus[k]} onChange={(e) => set({ focus: { ...s.focus, [k]: e.target.checked } })} aria-label={l} />
          </label>
        ))}
      </details>
      <div className="row between" style={{ margin: '12px 0 4px' }}>
        <span>Focus session length</span>
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
        Begin a focus session
      </button>
      <p className="muted small">Focus mode on, with a soft bell when the time is up. No streaks, counts or notifications.</p>
    </Modal>
  );
}
