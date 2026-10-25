import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateSettings, useSettings } from '../lib/store';

const DONE = 'sb:tour';
const STEP = 'sb:tourStep';
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
  control?: 'sound';
}

const q = (sel: string) => () => document.querySelector(sel);
const vis = (e: Element | null) => (e && e.getBoundingClientRect().width > 0 ? e : null);
const anyOf = (...sels: string[]) => () => sels.map((x) => vis(document.querySelector(x))).find(Boolean) ?? null;
const firstVerse = () => [...document.querySelectorAll('.v')].find((e) => { const r = e.getBoundingClientRect(); return r.top > 120 && r.bottom < window.innerHeight - 160 && r.height < 90; }) ?? document.querySelector('.v');
const tile = (href: string) => q(`.page a[href="#${href}"]`);
const panelTab = (name: RegExp) => () => [...document.querySelectorAll('aside.panel [role=tab]')].find((t) => name.test(t.textContent ?? '')) ?? null;

const STEPS: Step[] = [
  { part: 'Welcome', text: 'A quick tour. You will tap through the app yourself.', sub: 'A study Bible with more than 80,000 notes tied to verses, and over 100 works by the saints and Fathers.' },
  { part: 'Today', route: '/today', exact: true, find: q('.home-verse'), text: 'This is Today: a verse for the day, a saint’s words, and a question.' },
  { part: 'Today', route: '/today', exact: true, find: q('.resume-chips'), text: 'These take you back to where you left off.' },
  { part: 'Bible', route: '/today', exact: true, find: q('.tabs a[href^="#/read"]'), tap: true, text: 'Tap Bible to open it.' },
  { part: 'Bible', route: '/read', find: q('.reader-bar'), text: 'Pick a book up here, or switch translation.', sub: 'Modern English, Douay-Rheims, the Septuagint and more.' },
  { part: 'Bible', find: firstVerse, tap: true, hit: (t) => !!t.closest('.v'), text: 'Tap any verse.' },
  { part: 'Bible', narrow: true, find: q('.actionbar .btn.primary'), tap: true, text: 'Tap Study this passage.' },
  { part: 'Bible', find: () => document.querySelector('aside.panel [role=tablist]') ?? document.querySelector('aside.panel'), text: 'Every verse has its own notes.', sub: 'Haydock, à Lapide, the Church Fathers and saints: tens of thousands of notes, each tied to a verse.' },
  { part: 'Bible', find: panelTab(/Teaching/), tap: true, hit: (t) => /Teaching/.test(t.textContent ?? '') && !!t.closest('[role=tab]'), text: 'Tap Teaching.' },
  { part: 'Bible', closePanel: true, find: () => document.querySelector('aside.panel .sect, aside.panel'), text: 'The Catechism paragraphs that cite this verse, quoted in full.', sub: 'All 2,863 paragraphs, searchable.' },
  { part: 'Bible', find: anyOf('.reader-bar button[title^="Text, theme"]', '.reader-bar .more-btn'), text: 'Text size, themes, sound and more live here.', sub: 'Jesus’s words are in red, and a few key words glow or move.' },
  { part: 'Bible', find: anyOf('.reader-bar button[aria-label*="ound"]', '.reader-bar .more-btn'), control: 'sound', text: 'Gentle background sound is off. Want it?', sub: '“Choose for me” plays a quiet sound that suits the book, kept soft. Change it any time with the note icon.' },
  { part: 'Listen', find: q('.tabs a[href="#/listen"]'), tap: true, text: 'Tap Listen.' },
  { part: 'Listen', route: '/listen', find: q('.year-hero, .page h1'), text: 'The Bible in a Year, matched to every chapter.' },
  { part: 'Reading room', find: q('.tabs a[href="#/room"]'), tap: true, text: 'Tap Reading room.' },
  { part: 'Reading room', route: '/room', find: q('.page h1'), text: 'Read and listen beyond the Bible.', sub: 'Open any work and a Bible chapter sits beside it, so you can read the Scripture and what the saints made of it together. Many works have recordings too.' },
  { part: 'Study', find: q('.tabs a[href="#/study"]'), tap: true, text: 'Tap Study.' },
  { part: 'Study', route: '/study', exact: true, find: q('.page h1'), text: 'Study is where the deep tools are. Let us open a few.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/fathers'), tap: true, text: 'Tap the Reading room.' },
  { part: 'Study', route: '/study/fathers', find: q('.page h1'), text: 'Saints and Fathers, free to read in full.', sub: 'More than 100 works: Augustine, Chrysostom, Aquinas, Teresa, Thérèse and more. About ten million words.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/catechism'), tap: true, text: 'Tap the Catechism.' },
  { part: 'Study', route: '/study/catechism', find: q('.ccc-page input[type=search], .page input[type=search]'), text: 'The whole Catechism. Search it, or jump by number.', sub: 'Its Scripture footnotes link into the Bible.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/paths'), tap: true, text: 'Tap Study paths.' },
  { part: 'Study', route: '/study/paths', find: q('.page h1'), text: 'Guided journeys: a passage, a Father’s words, a question.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/universe'), text: 'The Scripture universe: all 73 books as a galaxy, with the Fathers in rings around them.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/quotations'), text: 'Who quoted this verse? Every Father and saint who cites it.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/gallery'), text: 'A gallery of paintings and engravings, with maps and a timeline beside it.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/apologetics'), text: 'Questions about the faith: short answers, with the verses and Catechism paragraphs to check them.' },
  { part: 'Study', route: '/study', exact: true, find: tile('/study/kids'), text: 'A Children’s Bible: stories at three reading levels, with videos.' },
  { part: 'Profile', find: q('.profile-btn'), tap: true, text: 'Tap the round Profile button, top right.' },
  { part: 'Profile', route: '/profile', exact: true, find: tile('/library'), tap: true, text: 'Tap Notes.' },
  { part: 'Profile', route: '/library', find: q('.page h1'), text: 'Your notes, highlights and bookmarks. Private to this device.', sub: 'Export them as Markdown, PDF or EPUB.' },
  { part: 'Profile', route: '/profile', exact: true, find: tile('/pray/plans'), text: 'Reading plans and memorizing keep your progress.' },
  { part: 'Profile', route: '/profile', exact: true, find: tile('/days'), text: 'Star a day on Today to keep it here.' },
  { part: 'Profile', route: '/profile', exact: true, find: tile('/settings'), tap: true, text: 'Tap Settings.' },
  { part: 'Profile', route: '/settings', find: q('.page h1'), text: 'Language, themes, sound, offline downloads and reminders.' },
  { part: 'Search', route: '/profile', wide: true, find: q('.search-tab'), text: 'Search jumps to any passage or page. Ctrl or ⌘ plus K does the same.' },
  { part: 'Done', route: '/today', exact: true, title: 'You are set', text: 'Take this tour again any time from Profile.' },
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

/** The first-run walkthrough: short steps that point at the real screen and ask you to tap through it. */
export default function Tour() {
  const [on, setOn] = useState(() => get(DONE) !== '1');
  const [i, setI] = useState(() => Math.min(Math.max(+(get(STEP) ?? 0) || 0, 0), STEPS.length - 1));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const [settings] = useSettings();
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
      if (el && el !== shown && step.tap) {
        shown = el;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 80 || r0.bottom > window.innerHeight - 200) el.scrollIntoView({ block: 'center' });
      }
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
  const pad = 6;
  const high = rect && rect.top > window.innerHeight / 2;
  return (
    <div className="tour-layer" role="dialog" aria-label="App tour" aria-live="polite">
      {blockers(step.tap ? rect : null, pad)}
      {rect && <div className="tour-ring" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}
      {!rect && <div className="tour-dim" />}
      <div className={`tour-card ${high ? 'top' : 'bottom'}${rect ? '' : ' mid'}`}>
        {(step.title || step.part) && <strong className="tour-title">{step.title ?? step.part}</strong>}
        <p>{step.text}</p>
        {step.sub && <p className="tour-sub">{step.sub}</p>}
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
