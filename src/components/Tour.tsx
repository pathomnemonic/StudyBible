import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateSettings } from '../lib/store';

const DONE = 'sb:tour';
const STEP = 'sb:tourStep';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

interface Step {
  /** the short text shown to the user */
  text: string;
  /** where this step lives; the tour goes there when it starts the step */
  route?: string;
  /** the thing to point at */
  find?: () => Element | null;
  /** when set, the step waits for the user to click the highlighted thing (Next skips ahead) */
  tap?: boolean;
  /** what counts as the tap (defaults to the highlighted thing); lets any verse count for "tap a verse" */
  hit?: (t: Element) => boolean;
  /** close the study panel when leaving this step, so it does not cover the tab bar */
  closePanel?: boolean;
  /** only on narrow screens (phones open the study panel with a button) */
  narrow?: boolean;
  /** only on wide screens (the Search button lives in the side rail) */
  wide?: boolean;
  title?: string;
}

const q = (sel: string) => () => document.querySelector(sel);
const firstVerse = () => [...document.querySelectorAll('.v')].find((e) => { const r = e.getBoundingClientRect(); return r.top > 120 && r.bottom < window.innerHeight - 160 && r.height < 90; }) ?? document.querySelector('.v');

const STEPS: Step[] = [
  { title: 'Welcome', text: 'A quick tour, about a minute. You will tap through the app yourself.' },
  { route: '/today', find: q('.home-verse'), text: 'This is Today: a verse for the day, a saint’s words, and a question.' },
  { route: '/today', find: q('.resume-chips'), text: 'These take you back to where you left off.' },
  { route: '/today', find: q('.tabs a[href^="#/read"]'), tap: true, text: 'Tap Bible to open it.' },
  { route: '/read', find: q('.reader-bar'), text: 'Pick any book and chapter from the title up here.' },
  { find: firstVerse, tap: true, hit: (t) => !!t.closest('.v'), text: 'Tap any verse.' },
  { narrow: true, find: q('.actionbar .btn.primary'), tap: true, text: 'Tap Study this passage.' },
  { closePanel: true, find: () => document.querySelector('aside.panel [role=tablist]') ?? document.querySelector('aside.panel'), text: 'Everything about that verse appears here: Church Fathers, notes, the Catechism and more.' },
  { find: q('.tabs a[href="#/listen"]'), tap: true, text: 'Tap Listen.' },
  { route: '/listen', find: q('.year-hero, .page h1'), text: 'The Bible in a Year, matched to every chapter.' },
  { find: q('.tabs a[href="#/study"]'), tap: true, text: 'Tap Study.' },
  { route: '/study', find: q('.page h1'), text: 'The Catechism, the Fathers, maps, a gallery and more.' },
  { find: q('.tabs a[href="#/profile"]'), tap: true, text: 'Tap Profile.' },
  { route: '/profile', find: q('.page h1'), text: 'Your notes, plans and settings live here.' },
  { route: '/profile', find: q('.search-tab'), wide: true, text: 'Search jumps to any passage or page. Ctrl or ⌘ plus K does the same.' },
  { route: '/today', title: 'You are set', text: 'That is the app. Take this tour again any time from Profile.' },
];

/** The first-run walkthrough: short steps that point at the real screen and ask you to tap through it. */
export default function Tour() {
  const [on, setOn] = useState(() => get(DONE) !== '1');
  const [i, setI] = useState(() => Math.min(Math.max(+(get(STEP) ?? 0) || 0, 0), STEPS.length - 1));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;
  const steps = STEPS.filter((s) => (!s.wide || wide) && (!s.narrow || !wide));
  const step = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  const done = useCallback(() => { put(DONE, '1'); put(STEP, '0'); put('sb:whatsNew', '2026-10b'); setOn(false); }, []);
  const go = useCallback((n: number) => { if (steps[i]?.closePanel) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); const k = Math.max(0, n); if (k >= steps.length) return done(); setI(k); put(STEP, String(k)); }, [steps, i, done]);

  // the tour is the introduction: hold back the one-time sound tip so it does not cover the screen
  useEffect(() => { if (on) updateSettings({ ambienceTipSeen: true }); }, [on]);
  useEffect(() => {
    const h = () => { setI(0); put(STEP, '0'); put(DONE, '0'); setOn(true); nav('/today'); };
    window.addEventListener('studybible:tour', h);
    return () => window.removeEventListener('studybible:tour', h);
  }, [nav]);

  // each step: go to its page if it names one and we are not on it
  useEffect(() => {
    if (!on || !step.route) return;
    const here = loc.pathname === '/' ? '/today' : loc.pathname;
    if (!here.startsWith(step.route)) nav(step.route === '/read' ? '/read' : step.route);
  }, [on, i]);

  // keep the highlight on the element, which may appear a moment after the page does
  useEffect(() => {
    if (!on) return;
    let live = true;
    const tick = () => {
      if (!live) return;
      const el = step.find?.() ?? null;
      const r = el ? el.getBoundingClientRect() : null;
      setRect((old) => (r && r.width > 0 ? (old && Math.abs(old.top - r.top) < 1 && Math.abs(old.left - r.left) < 1 && Math.abs(old.width - r.width) < 1 && Math.abs(old.height - r.height) < 1 ? old : r) : null));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => { live = false; window.clearInterval(id); };
  }, [on, i, loc.pathname]);

  // a step that asks for a tap moves on when the highlighted thing is tapped
  const ref = useRef({ step, go, i });
  ref.current = { step, go, i };
  useEffect(() => {
    if (!on) return;
    const h = (e: Event) => {
      const { step: s, go: g, i: n } = ref.current;
      if (!s.tap || !(e.target instanceof Element)) return;
      const el = s.find?.() ?? null;
      if ((s.hit && s.hit(e.target)) || (el && el.contains(e.target))) window.setTimeout(() => g(n + 1), 450);
    };
    document.addEventListener('click', h, true);
    return () => document.removeEventListener('click', h, true);
  }, [on]);

  if (!on) return null;
  const high = rect && rect.top > window.innerHeight / 2;
  const pad = 6;
  return (
    <div className="tour-layer" role="dialog" aria-label="App tour" aria-live="polite">
      {rect && <div className="tour-ring" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}
      {!rect && <div className="tour-dim" />}
      <div className={`tour-card ${high ? 'top' : 'bottom'}${rect ? '' : ' mid'}`}>
        {step.title && <strong className="tour-title">{step.title}</strong>}
        <p>{step.text}</p>
        <div className="tour-bar">
          <span className="tour-count" aria-label={`Step ${i + 1} of ${steps.length}`}>{i + 1} / {steps.length}</span>
          <span className="tour-btns">
            <button className="btn ghost small" onClick={done}>{last ? 'Close' : 'End tour'}</button>
            {i > 0 && !last && <button className="btn small" onClick={() => go(i - 1)}>Back</button>}
            {last ? <button className="btn primary small" onClick={done}>Done</button> : <button className={`btn small${step.tap ? '' : ' primary'}`} onClick={() => go(i + 1)}>{step.tap ? 'Skip step' : 'Next'}</button>}
          </span>
        </div>
      </div>
    </div>
  );
}
