import { useState } from 'react';
import { updateSettings, useSettings } from '../lib/store';

const KEY = 'sb:audienceAsked';
/** One question, asked the first time Learn is opened: who is learning. It only decides which lessons come first; "Not now" keeps the adult default. */
export default function AudienceAsk() {
  const [s] = useSettings();
  const [gone, setGone] = useState(() => { try { return !!localStorage.getItem(KEY); } catch { return true; } });
  if (gone || s.audience) return null;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ } setGone(true); };
  const pick = (a: 'adult' | 'youth' | 'parent' | 'teacher') => { updateSettings({ audience: a }); close(); };
  return (
    <aside className="tip-card" role="note" aria-label="Who is learning">
      <div className="tip-body"><strong>Who are the lessons for?</strong>
        <div className="level-chips" role="group" aria-label="Who is learning" style={{ marginTop: 6 }}>
          <button className="chip" onClick={() => pick('adult')}>Me, an adult</button>
          <button className="chip" onClick={() => pick('youth')}>A student</button>
          <button className="chip" onClick={() => pick('parent')}>My children</button>
          <button className="chip" onClick={() => pick('teacher')}>My class</button>
        </div>
      </div>
      <button className="btn small ghost" onClick={close}>Not now</button>
    </aside>
  );
}
