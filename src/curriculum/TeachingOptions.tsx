import { useEffect, useMemo, useState } from 'react';
import type { BandId, Glossary, LessonSpec } from './model';
import { buildMenu, chosen, fitToTime, SETUPS, totalMinutes, type Setup } from './options';
import { KIT_ICON, KIT_LABEL, KIT_RANK, type Option } from './techniques';

const SETUP_KEY = 'sb:cur:setup';
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

function OptionCard({ o, picked, onPick, setup }: { o: Option; picked: boolean; onPick: () => void; setup: Setup }) {
  return (
    <div className="to-card" role="tabpanel">
      <div className="to-meta">
        <span className="to-kit" title={KIT_LABEL[o.kit]}>{KIT_ICON[o.kit]} {KIT_LABEL[o.kit]}</span>
        <span className="muted small">{o.minutes} min · {o.method}</span>
      </div>
      <p className="to-prep"><strong>Get ready:</strong> {o.prep}</p>
      <ol className="to-steps">{o.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      {o.without && KIT_RANK[o.kit] > KIT_RANK.voice && <p className="small to-without"><strong>If you do not have it:</strong> {o.without}</p>}
      {o.tip && <p className="small muted to-tip"><em>Teacher’s tip:</em> {o.tip}</p>}
      <button className={`btn small${picked ? ' primary' : ''}`} aria-pressed={picked} onClick={onPick}>{picked ? '✓ In my plan' : 'Use this one'}</button>
    </div>
  );
}

function Chooser({ label, options, sel, onSel, setup }: { label: string; options: Option[]; sel: number; onSel: (i: number) => void; setup: Setup }) {
  const [view, setView] = useState(sel);
  useEffect(() => setView(Math.min(sel, Math.max(0, options.length - 1))), [options]);
  if (!options.length) return null;
  const v = Math.min(view, options.length - 1);
  return (
    <div className="to-chooser">
      <div className="tabbar to-tabs" role="tablist" aria-label={label}>
        {options.map((o, i) => <button key={o.id} role="tab" aria-selected={v === i} className={i === sel ? 'to-picked' : ''} onClick={() => setView(i)}>{String.fromCharCode(65 + i)} · {o.title}{i === sel ? ' ✓' : ''}</button>)}
      </div>
      <OptionCard o={options[v]} picked={v === sel} onPick={() => onSel(v)} setup={setup} />
    </div>
  );
}

/** "Teach each idea your way": for each idea in the lesson, several ways to teach it, filtered to what the teacher has. */
export default function TeachingOptions({ lesson, band, gl, minutes }: { lesson: LessonSpec; band: BandId; gl: Glossary; minutes: number }) {
  const [setup, setSetup] = useState<Setup>(() => read<Setup>(SETUP_KEY, 'paper'));
  const pk = `sb:cur:picks:${lesson.id}`;
  const [picks, setPicks] = useState<Record<string, number>>(() => read(pk, {}));
  useEffect(() => setPicks(read(pk, {})), [lesson.id]);
  const menu = useMemo(() => buildMenu(lesson, band, gl, setup), [lesson, band, gl, setup]);
  const set = (k: string, i: number) => { const next = { ...picks, [k]: i }; setPicks(next); write(pk, next); };
  const changeSetup = (s: Setup) => { setSetup(s); write(SETUP_KEY, s); setPicks({}); write(pk, {}); };
  const total = totalMinutes(menu, picks);
  const c = chosen(menu, picks);
  const [copied, setCopied] = useState(false);
  const plan = [
    ['Open', c.opening], ...c.concepts.map((o, i) => [`Idea ${i + 1}`, o] as [string, Option | undefined]), ['Close', c.closing],
  ].filter(([, o]) => o) as [string, Option][];
  const copy = async () => {
    const text = `${lesson.title}\n` + plan.map(([n, o]) => `${n} (${o.minutes} min): ${o.title}\n  ${o.steps.join('\n  ')}`).join('\n\n') + `\n\nTotal: ${total} minutes`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };
  return (
    <section className="sect teach-opts" aria-label="Teaching options">
      <h2 className="eyebrow-h">Teach each idea your way</h2>
      <p className="muted small">Every idea in this lesson has three different ways to teach it, drawn from established classroom practice. Choose what suits your group and what you have with you. Your choices are remembered for this lesson.</p>
      <div className="to-setup no-print" role="radiogroup" aria-label="What do you have today?">
        {SETUPS.map(([s, name, d]) => <button key={s} role="radio" aria-checked={setup === s} className={`chip${setup === s ? ' on' : ''}`} title={d} onClick={() => changeSetup(s)}>{KIT_ICON[s]} {name}</button>)}
      </div>
      <p className="muted small">{SETUPS.find(([s]) => s === setup)![2]}. Options that need more than this are hidden.</p>

      {menu.opening.length > 0 && <><h3>Open the lesson</h3><Chooser label="Opening options" options={menu.opening} sel={picks.open ?? 0} onSel={(i) => set('open', i)} setup={setup} /></>}
      {menu.concepts.map((cm) => (
        <div key={cm.n} className="to-idea">
          <h3>Idea {cm.n + 1}: <span className="to-gist">{cm.gist}</span></h3>
          <Chooser label={`Ways to teach idea ${cm.n + 1}`} options={cm.options} sel={picks[String(cm.n)] ?? 0} onSel={(i) => set(String(cm.n), i)} setup={setup} />
        </div>
      ))}
      {menu.closing.length > 0 && <><h3>Close and check</h3><Chooser label="Closing options" options={menu.closing} sel={picks.close ?? 0} onSel={(i) => set('close', i)} setup={setup} /></>}

      <div className="to-plan">
        <h3 style={{ marginTop: 0 }}>Your plan <span className={`muted small${total > minutes ? ' to-over' : ''}`}>{total} of {minutes} minutes{total > minutes ? ' · over time' : ''}</span></h3>
        {total > minutes && <p className="small no-print" style={{ marginTop: 0 }}>This is longer than your class. <button className="btn small" onClick={() => { const n = fitToTime(menu, picks, minutes); setPicks(n); write(pk, n); }}>Fit to my time</button></p>}
        <ol>{plan.map(([n, o]) => <li key={n}><strong>{n}:</strong> {o.title} <span className="muted small">({o.minutes} min)</span></li>)}</ol>
        <div className="row no-print" style={{ gap: 6 }}><button className="btn small" onClick={copy}>{copied ? 'Copied ✓' : 'Copy my plan'}</button><button className="btn small" onClick={() => window.print()}>🖨 Print my plan</button></div>
      </div>
    </section>
  );
}
