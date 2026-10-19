import Modal from './Modal';
import { useSettings, type ThemeName } from '../lib/store';

export default function TextSettings({ onClose }: { onClose: () => void }) {
  const [s, set] = useSettings();
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
        <div className="chips">
          {(['narrow', 'normal', 'wide'] as const).map((m) => (
            <button key={m} className={`chip${s.margin === m ? ' sel' : ''}`} onClick={() => set({ margin: m })}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Typeface</span>
        <div className="chips">
          {(['serif', 'sans'] as const).map((m) => (
            <button key={m} className={`chip${s.fontFamily === m ? ' sel' : ''}`} onClick={() => set({ fontFamily: m })}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="row between" style={{ margin: '10px 0' }}>
        <span>Theme</span>
        <div className="chips">
          {(['light', 'sepia', 'dark', 'system'] as ThemeName[]).map((m) => (
            <button key={m} className={`chip${s.theme === m ? ' sel' : ''}`} onClick={() => set({ theme: m })}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Verse numbers</span>
        <input type="checkbox" checked={s.showVerseNumbers} onChange={(e) => set({ showVerseNumbers: e.target.checked })} />
      </label>
      <label className="row between" style={{ margin: '10px 0' }}>
        <span>Scripture only (hide navigation and study tools)</span>
        <input type="checkbox" checked={s.scriptureOnly} onChange={(e) => set({ scriptureOnly: e.target.checked })} />
      </label>
    </Modal>
  );
}
