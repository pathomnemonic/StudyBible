import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { THEMES, getSettings, updateSettings, useSettings, type ThemeName } from '../lib/store';
import { TRADITIONS } from '../lib/tradition';
import { useEditions } from '../data/EditionsContext';
import BiayChoice from './BiayChoice';

const DONE = 'sb:tour';
const STEP = 'sb:tourStep';
/** True once the reader has finished or left the tour, or went through the older setup: they are never shown it again. */
export const tourSeen = () => { try { return localStorage.getItem('sb:tour') === '1' || !!localStorage.getItem('sb:welcomed') || !!localStorage.getItem('sb:setup') || localStorage.getItem('sb:intro') === '1'; } catch { return true; } };
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

interface Step {
  /** the short text shown to the user */
  text: string;
  /** where this step lives; the tour goes there when it starts the step */
  route?: string;
  /** a small label above the text */
  part?: string;
  /** a quieter line under the text */
  sub?: string;
  /** go to the route only when the current page is not exactly it (default: any page under it will do) */
  exact?: boolean;
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
  /** a small control shown in the card */
  control?: 'sound' | 'tradition' | 'theme' | 'size' | 'biay';
  /** show this step only when this is true (it can depend on an earlier answer) */
  when?: () => boolean;
  /** bring the highlighted thing into view even when no tap is asked for */
  scroll?: boolean;
}

const q = (sel: string) => () => document.querySelector(sel);
const vis = (e: Element | null) => (e && e.getBoundingClientRect().width > 0 ? e : null);
const anyOf = (...sels: string[]) => () => sels.map((x) => vis(document.querySelector(x))).find(Boolean) ?? null;
const firstVerse = () => [...document.querySelectorAll('.v')].find((e) => { const r = e.getBoundingClientRect(); return r.top > 120 && r.bottom < window.innerHeight - 160 && r.height < 90; }) ?? document.querySelector('.v');
const verse51 = () => document.querySelector('.v[data-v="51"]');
const verseNum51 = () => document.querySelector('.v[data-v="51"] .vn') ?? document.querySelector('.v[data-v="51"]');
const tile = (href: string) => q(`.page a[href="#${href}"]`);
const panelTab = (name: RegExp) => () => [...document.querySelectorAll('aside.panel [role=tab]')].find((t) => name.test(t.textContent ?? '')) ?? null;

const mediaTab = (name: RegExp) => () => [...document.querySelectorAll('[role=tab]')].find((t) => name.test(t.textContent ?? '') && t.getBoundingClientRect().width > 0) ?? null;
const saintsHeading = () => [...document.querySelectorAll('aside.panel h3')].find((h) => /Church Fathers and saints/i.test(h.textContent ?? '')) ?? null;
const noBiay = () => getSettings().activePlan === '' && getSettings().dashboard.hidden.includes('biay');

const STEPS: Step[] = [
  { part: 'Today', route: '/today', exact: true, find: q('.home-verse'), text: 'Today: a verse, a saint’s words and a question for the day.', sub: 'Pick up where you left off from the buttons below. Tap the pen to write your answer to the question.' },
  { part: 'Bible', route: '/read/webc/JHN/6', find: verseNum51, tap: true, hit: (t) => !!t.closest('.v[data-v="51"] .vn'), text: 'Tap the little number beside verse 51.', sub: 'That number is a shortcut: it opens everything gathered around the verse. Tapping the verse itself selects it for highlights and notes.' },
  { part: 'The saints', scroll: true, find: saintsHeading, text: 'Here are the Church Fathers and saints, in their own words, on this very verse.', sub: 'Notes also holds the Catechism and the commentators. Tap any writing to read it in its book. Their works are joined to the verses they discuss across the whole Bible.' },
  { part: 'Bible in a Year', route: '/listen', find: mediaTab(/^Year/), tap: true, hit: (t) => /^Year/.test(t.textContent ?? '') && !!t.closest('[role=tab]'), text: 'Tap Year: Bible in a Year, each day’s episode with its reading.' },
  { part: 'Bible in a Year', route: '/listen', find: mediaTab(/^Year/), text: 'Have you listened to Bible in a Year before?', sub: 'Your answer sets where it starts. You can skip this and change it later.', control: 'biay' },
  { part: 'Media', route: '/listen', find: mediaTab(/^For you/), tap: true, when: noBiay, hit: (t) => /^For you/.test(t.textContent ?? '') && !!t.closest('[role=tab]'), text: 'Pick other Catholic media here.', sub: 'Choose podcasts, audiobooks and video creators you like, and Media puts them first.' },
  { part: 'The saints, read aloud', route: '/listen', find: mediaTab(/^Books/), tap: true, hit: (t) => /^Books/.test(t.textContent ?? '') && !!t.closest('[role=tab]'), text: 'Tap Books: free LibriVox recordings of the saints’ own books.', sub: 'Augustine’s Confessions, the Imitation of Christ and more, with your place remembered.' },
  { part: 'Hard questions', route: '/learn', exact: true, find: tile('/study/apologetics-tracks'), tap: true, hit: (t) => !!t.closest('a[href="#/study/apologetics-tracks"]'), text: 'Tap Learn to answer.', sub: 'Step-by-step tracks for the questions people really ask, with the Fathers, the Catechism and Scripture behind each answer.' },
  { part: 'Hard questions', route: '/study/apologetics-tracks', exact: true, scroll: true, find: q('.apt-card'), text: 'Pick a question, such as atheism, the Resurrection or moral relativism, and work through it level by level.', sub: 'Questions about the faith, Is that true? and the Argument Map sit next to it in Learn.' },
  { part: 'Done', route: '/today', exact: true, title: 'That is all you need', text: 'Red dots mark what you have not opened yet, and each new feature explains itself the first time. Everything is also in Search and on the Everything page.' },
];

/** Invisible shields over everything except the one thing to tap, so a stray tap cannot break the tour. */
function blockers(hole: DOMRect | null, pad: number) {
  if (!hole) return <div className="tour-block" style={{ inset: 0 }} />;
  const t = Math.max(0, hole.top - pad), l = Math.max(0, hole.left - pad), r = hole.right + pad, b = hole.bottom + pad;
  return (
    <>
      <div className="tour-block" style={{ top: 0, left: 0, right: 0, height: t }} />
      <div className="tour-block" style={{ top: b, left: 0, right: 0, bottom: 0 }} />
      <div className="tour-block" style={{ top: t, left: 0, width: l, height: b - t }} />
      <div className="tour-block" style={{ top: t, left: r, right: 0, height: b - t }} />
    </>
  );
}

function TourControl({ kind }: { kind: 'tradition' | 'theme' | 'size' }) {
  const [st] = useSettings();
  const { editions } = useEditions();
  if (kind === 'tradition') {
    return (
      <select className="tour-select" value={st.tradition} onChange={(e) => updateSettings({ tradition: e.target.value as typeof st.tradition })} aria-label="Your Church">
        {TRADITIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    );
  }
  if (kind === 'theme') {
    const pick: ThemeName[] = ['twilight', 'light', 'paper', 'sepia', 'dark', 'zen'];
    return (
      <div className="tour-switch" role="group" aria-label="Theme">
        {pick.map((id) => { const t = THEMES.find((x) => x[0] === id); return t ? <button key={id} className={st.theme === id ? 'on' : ''} aria-pressed={st.theme === id} onClick={() => updateSettings({ theme: id })}>{t[1]}</button> : null; })}
      </div>
    );
  }
  const shown = editions.filter((e) => !e.offByDefault || e.id === st.defaultEdition);
  return (
    <>
      <select className="tour-select" value={st.defaultEdition} onChange={(e) => updateSettings({ defaultEdition: e.target.value })} aria-label="Translation">
        {shown.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="tour-switch" role="group" aria-label="Text size">
        <button onClick={() => updateSettings({ fontSize: Math.max(14, st.fontSize - 2) })} aria-label="Smaller text">A−</button>
        <span className="tour-size" aria-live="polite">{st.fontSize}</span>
        <button onClick={() => updateSettings({ fontSize: Math.min(32, st.fontSize + 2) })} aria-label="Larger text">A+</button>
      </div>
    </>
  );
}

/** The first-run walkthrough: short steps that point at the real screen and ask you to tap through it. */
export default function Tour() {
  const [on, setOn] = useState(() => !tourSeen());
  const [i, setI] = useState(() => Math.min(Math.max(+(get(STEP) ?? 0) || 0, 0), STEPS.length - 1));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const [settings] = useSettings();
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;
  const steps = STEPS.filter((s) => (!s.wide || wide) && (!s.narrow || !wide) && (!s.when || s.when()));
  const step = steps[Math.min(i, steps.length - 1)];
  const last = i >= steps.length - 1;
  const done = useCallback(() => { put(DONE, '1'); put(STEP, '0'); put('sb:whatsNew', '2026-10b'); put('sb:welcomed', '1'); put('sb:setup', '2'); updateSettings({ onboarded: true }); setOn(false); }, []);
  const go = useCallback((n: number) => { if (steps[i]?.closePanel) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); const k = Math.max(0, n); if (k >= steps.length) return done(); setI(k); put(STEP, String(k)); }, [steps, i, done]);

  // the tour is the introduction: hold back the one-time sound tip so it does not cover the screen
  useEffect(() => { if (on) updateSettings({ ambienceTipSeen: true }); }, [on]);
  useEffect(() => {
    const h = () => { setI(0); put(STEP, '0'); put(DONE, '0'); setOn(true); nav('/today'); };
    window.addEventListener('studybible:tour', h);
    return () => window.removeEventListener('studybible:tour', h);
  }, [nav]);

  // each step: go to its page if it names one and we are not on it
  // and if a stray tap lands somewhere else, bring it back (the next step's page is fine: that is where a tap leads)
  useEffect(() => {
    if (!on || !step.route) return;
    const here = loc.pathname === '/' ? '/today' : loc.pathname;
    const at = (s?: Step) => !!s?.route && (s.exact ? here === s.route : here === s.route || here.startsWith(s.route + '/'));
    if (at(step) || (step.tap && at(steps[i + 1]))) return;
    const t = window.setTimeout(() => nav(step.route!), step.tap ? 700 : 0);
    return () => window.clearTimeout(t);
  }, [on, i, loc.pathname]);

  // keep the highlight on the element, which may appear a moment after the page does
  useEffect(() => {
    if (!on) return;
    let live = true;
    let shown: Element | null = null;
    const tick = () => {
      if (!live) return;
      const el = step.find?.() ?? null;
      // bring the thing into view (clear of the card and the tab bar) the first time it appears
      if (el && el !== shown && (step.tap || step.scroll)) {
        shown = el;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 80 || r0.bottom > window.innerHeight - 200) el.scrollIntoView({ block: 'center' });
      }
      const r = el ? el.getBoundingClientRect() : null;
      setRect((old) => (r && r.width > 0 ? (old && Math.abs(old.top - r.top) < 1 && Math.abs(old.left - r.left) < 1 && Math.abs(old.width - r.width) < 1 && Math.abs(old.height - r.height) < 1 ? old : r) : null));
    };
    tick();
    const id = window.setInterval(tick, 250);
    // the page or the panel can scroll under the ring: follow it on the next frame instead of waiting for the timer
    let raf = 0;
    const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); };
    window.addEventListener('scroll', soon, true);
    window.addEventListener('resize', soon);
    window.visualViewport?.addEventListener('resize', soon);
    window.visualViewport?.addEventListener('scroll', soon);
    return () => { live = false; window.clearInterval(id); if (raf) cancelAnimationFrame(raf); window.removeEventListener('scroll', soon, true); window.removeEventListener('resize', soon); window.visualViewport?.removeEventListener('resize', soon); window.visualViewport?.removeEventListener('scroll', soon); };
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
  const pad = 6;
  // a very small thing (a verse number) gets a ring big enough to see and to tap
  const box = rect && (rect.width < 40 || rect.height < 40) ? new DOMRect(rect.left + rect.width / 2 - Math.max(rect.width, 40) / 2, rect.top + rect.height / 2 - Math.max(rect.height, 40) / 2, Math.max(rect.width, 40), Math.max(rect.height, 40)) : rect;
  const high = rect && rect.top > window.innerHeight / 2;
  return (
    <div className="tour-layer" role="dialog" aria-label="App tour" aria-live="polite">
      {blockers(step.tap ? box : null, pad)}
      {box && <div className="tour-ring" style={{ top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 }} />}
      {!rect && <div className="tour-dim" />}
      <div className={`tour-card ${high ? 'top' : 'bottom'}${rect ? '' : ' mid'}`}>
        {(step.title || step.part) && <strong className="tour-title">{step.title ?? step.part}</strong>}
        <p>{step.text}</p>
        {step.sub && <p className="tour-sub">{step.sub}</p>}
        {step.control === 'biay' && <BiayChoice />}
        {step.control && step.control !== 'sound' && step.control !== 'biay' && <TourControl kind={step.control} />}
        {step.control === 'sound' && (
          <div className="tour-switch" role="group" aria-label="Background sound">
            <button className={settings.ambience.kind === 'off' ? 'on' : ''} aria-pressed={settings.ambience.kind === 'off'} onClick={() => updateSettings({ ambience: { ...settings.ambience, kind: 'off' }, ambienceTipSeen: true })}>Off</button>
            <button className={settings.ambience.kind !== 'off' ? 'on' : ''} aria-pressed={settings.ambience.kind !== 'off'} onClick={() => updateSettings({ ambience: { ...settings.ambience, kind: 'auto' }, ambienceTipSeen: true })}>Choose for me</button>
          </div>
        )}
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
