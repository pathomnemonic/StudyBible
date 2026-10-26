import { useEffect, useRef } from 'react';
import FinePrint from '../components/FinePrint';
import { Link } from 'react-router-dom';
import { updateSettings, useSettings } from '../lib/store';
import { ESTIMATORS, lifeStats, lineOfTheDay, parseBirthday } from '../lib/memento';

const css = (n: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb;

/** Each box is a week: the weeks lived are filled, the weeks left are empty. */
function WeeksGrid({ lived, total }: { lived: number; total: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const cols = 52, rows = Math.ceil(total / cols), cell = 8, gap = 2;
    const dpr = window.devicePixelRatio || 1;
    c.width = (cols * (cell + gap)) * dpr; c.height = (rows * (cell + gap)) * dpr;
    c.style.aspectRatio = `${cols * (cell + gap)} / ${rows * (cell + gap)}`;
    const g = c.getContext('2d'); if (!g) return;
    g.scale(dpr, dpr);
    const fill = css('--accent', '#a78bfa'), line = css('--border-strong', '#555'), now = css('--text', '#fff');
    for (let i = 0; i < total; i++) {
      const x = (i % cols) * (cell + gap), y = Math.floor(i / cols) * (cell + gap);
      if (i < lived) { g.fillStyle = fill; g.fillRect(x, y, cell, cell); }
      else { g.strokeStyle = line; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1); }
      if (i === lived) { g.strokeStyle = now; g.lineWidth = 2; g.strokeRect(x, y, cell, cell); }
    }
  }, [lived, total]);
  return <canvas ref={ref} className="memento-grid" role="img" aria-label={`${lived.toLocaleString()} weeks lived, shaded, and ${Math.max(0, total - lived).toLocaleString()} weeks left, empty. Each row is one year.`} />;
}

/** Remember that you will die, as the saints did: a quiet look at the weeks of one life, held in hope. Opt-in, and private to this device. */
export default function MementoPage() {
  const [s] = useSettings();
  const m = s.memento;
  const st = lifeStats(m.birthday, m.expectancy);
  const set = (p: Partial<typeof m>) => updateSettings({ memento: { ...m, ...p } });
  const line = lineOfTheDay();
  const badDate = m.birthday && !parseBirthday(m.birthday);
  return (
    <div className="page memento">
      <h1>Memento mori</h1>
      <p className="lede">“Remember that you will die.” The saints kept death before their eyes, not to be gloomy, but to live each day for what lasts. This is an optional, private reminder.</p>

      <section className="card">
        <label className="row between"><span><strong>Show my life as a progress bar</strong><br /><small className="muted">Off until you choose it. Nothing is sent anywhere.</small></span>
          <input type="checkbox" checked={m.on} onChange={(e) => set({ on: e.target.checked })} aria-label="Turn on Memento mori" /></label>
        {m.on && <>
          <label className="row between" style={{ marginTop: 10 }}><span>Your birthday</span><input type="date" value={m.birthday} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ birthday: e.target.value })} aria-label="Birthday" /></label>
          {badDate && <p className="small" role="alert">That date does not look right.</p>}
          <label className="row between" style={{ marginTop: 10 }}><span>Your own estimate of a full life (years)</span>
            <input type="number" min={30} max={120} value={m.expectancy} onChange={(e) => set({ expectancy: Math.max(30, Math.min(120, +e.target.value || 80)) })} aria-label="Estimated years" style={{ width: 80 }} /></label>
          <p className="muted small">80 is a common round figure. Nobody knows their number: it is only a way to see time.</p>
          <details><summary>Get a better estimate</summary>
            <p className="small">These are outside websites. Open one, then come back and type the age it gives you above.</p>
            <ul>{ESTIMATORS.map((e) => <li key={e.url}><a href={e.url} target="_blank" rel="noreferrer noopener">{e.name}</a> <span className="muted small">{e.note}</span></li>)}</ul>
          </details>
          <label className="row between" style={{ marginTop: 10 }}><span>Show the bar on Today</span><input type="checkbox" checked={m.onHome} onChange={(e) => set({ onHome: e.target.checked })} aria-label="Show on Today" /></label>
          <div className="tabbar" role="tablist" aria-label="View" style={{ marginTop: 10 }}>
            <button role="tab" aria-selected={m.view === 'bar'} onClick={() => set({ view: 'bar' })}>Progress bar</button>
            <button role="tab" aria-selected={m.view === 'weeks'} onClick={() => set({ view: 'weeks' })}>Weeks of a life</button>
          </div>
        </>}
      </section>

      {m.on && st.valid && <section className="card">
        {m.view === 'bar'
          ? <>
            <div className="memento-bar big" role="progressbar" aria-valuenow={st.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of life passed"><i style={{ width: `${st.pct}%` }} /></div>
            <p className="memento-big">{st.beyond ? 'You are past your own estimate. Every day is a gift.' : `${st.pct}% of your life has passed`}</p>
            <p className="muted">{st.yearsLived} years lived · {st.weeksLived.toLocaleString()} weeks{st.beyond ? '' : ` · about ${st.weeksLeft.toLocaleString()} weeks (${st.yearsLeft} years) remain by your estimate`}</p>
          </>
          : <>
            <WeeksGrid lived={st.weeksLived} total={Math.max(st.totalWeeks, st.weeksLived + 1)} />
            <p className="muted small">Each box is one week, each row one year. Shaded: lived. Empty: to come. The outlined box is this week.</p>
          </>}
      </section>}

      <section className="card memento-line">
        <blockquote>“{line.text}”</blockquote><footer>{line.src}</footer>
        <p className="small">Ask yourself: if this week were my last, what would I want to have done, said or asked forgiveness for? <Link to="/pray/examination">Examine my conscience</Link> · <Link to="/pray/devotions/confession">Confession guide</Link> · <Link to="/pray/intentions">My prayer list</Link></p>
      </section>
      <FinePrint>This is a reflection tool, not a prediction or medical advice. If thoughts about death are heavy or frightening for you right now, talk to a priest, a counselor or someone you trust. In the U.S. you can call or text 988 at any time.</FinePrint>
    </div>
  );
}
