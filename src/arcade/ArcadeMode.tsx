import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import '@fontsource/lilita-one';
import '@fontsource-variable/fredoka';
import '../styles/arcade.css';
import { blip, burst, ring, setSound, soundOn } from './fx';
import { Anim, Art } from './art';

const WINS: [string, string][] = [['1f389', 'Nice work!'], ['1f3c6', 'Well played!'], ['1f973', 'Brilliant!'], ['1f929', 'You did it!']];

/** True for every page that belongs to the games world. */
export const inArcade = (path: string) => path === '/play' || path.startsWith('/play/');

/**
 * The games are their own world: while a games page is open the whole screen takes on the arcade look (see src/styles/arcade.css), with a moving backdrop,
 * a burst of confetti when a game finishes, a ring under every tap, and optional sound. Leaving /play puts everything back.
 */
export default function ArcadeMode() {
  const { pathname } = useLocation();
  const on = inArcade(pathname);
  const [sound, setSoundState] = useState(soundOn);
  const [win, setWin] = useState<number | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const game = pathname.split('/')[2] ?? 'home';
  useEffect(() => {
    if (!on) return;
    document.documentElement.dataset.arcade = '1';
    return () => { delete document.documentElement.dataset.arcade; delete document.documentElement.dataset.game; };
  }, [on]);
  useEffect(() => { if (on) document.documentElement.dataset.game = game; }, [on, game]);
  // the sound switch lives with the game's own How to play row when it has one (so it never sits on top of the play area); otherwise it floats in the corner
  useEffect(() => {
    if (!on) return;
    setSlot(null);
    let made: HTMLElement | null = null;
    const find = () => {
      if (made?.isConnected) return;
      const host = document.querySelector('.game-help');
      if (host) { made = document.createElement('div'); made.className = 'arc-sound-slot'; host.appendChild(made); setSlot(made); }
    };
    const obs = new MutationObserver(find);
    obs.observe(document.body, { childList: true, subtree: true });
    find();
    return () => { obs.disconnect(); made?.remove(); setSlot(null); };
  }, [on, pathname]);
  useEffect(() => { if (win === null) return; const t = window.setTimeout(() => setWin(null), 2400); return () => window.clearTimeout(t); }, [win]);
  useEffect(() => {
    if (!on) return;
    // a finished game: any result panel that appears gets confetti once
    const seen = new WeakSet<Element>();
    const finish = '.ws-end, .dw-results, .tv-over, .q-win, .vb-win, [data-win]';
    const obs = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        const el = n.matches(finish) ? n : n.querySelector(finish);
        if (el && !seen.has(el)) { seen.add(el); burst(); blip('win'); setWin(Math.floor(Math.random() * WINS.length)); }
      });
      // right and wrong answers: a sound when a choice turns green or red
      for (const m of muts) if (m.type === 'attributes' && m.target instanceof HTMLElement) {
        const c = m.target.classList;
        if (c.contains('right') || c.contains('hit') && m.target.classList.contains('vb-cell')) blip('good');
        else if (c.contains('wrong') || c.contains('bad')) blip('bad');
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    const tap = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, a, [role=button], .q-tile, .ws-cell, .cw-cell, .vb-key, label')) { ring(e.clientX, e.clientY); blip('tap'); }
    };
    document.addEventListener('pointerdown', tap, true);
    return () => { obs.disconnect(); document.removeEventListener('pointerdown', tap, true); };
  }, [on]);
  if (!on) return null;
  const SOUND = (
    <button type="button" className={slot ? 'arc-sound inline' : 'arc-sound'} aria-pressed={sound} aria-label={sound ? 'Sound on. Tap to turn off' : 'Sound off. Tap to turn on'} onClick={() => { const next = !sound; setSound(next); setSoundState(next); if (next) blip('good'); }}><span aria-hidden="true">{sound ? '🔊' : '🔇'}</span>{slot && <span className="arc-sound-txt">{sound ? 'Sound on' : 'Sound off'}</span>}</button>
  );
  return (
    <>
      {game === 'deepwaters' && (
        <div className="arc-sea" aria-hidden="true">
          <i className="sea-rays" />
          {Array.from({ length: 16 }, (_, i) => <b key={i} className="sea-bubble" style={{ ['--x' as string]: `${(i * 29 + 5) % 97}%`, ['--s' as string]: `${6 + (i % 5) * 5}px`, ['--t' as string]: `${7 + (i % 6) * 2}s`, ['--d' as string]: `${(i * 1.3) % 9}s` }} />)}
          <Art n="fish" size={64} className="sea-fish f1" />
          <Art n="dolphin" size={96} className="sea-fish f2" />
          <Art n="whale" size={150} className="sea-fish f3" />
          <Art n="octopus" size={84} className="sea-fish f4" />
          <Art n="turtle" size={70} className="sea-fish f5" />
          <i className="sea-floor" />
        </div>
      )}
      <div className="arc-bg" aria-hidden="true">
        <i className="arc-blob b1" /><i className="arc-blob b2" /><i className="arc-blob b3" />
        {Array.from({ length: 14 }, (_, i) => <b key={i} className={`arc-shape s${i % 5}`} style={{ ['--x' as string]: `${(i * 37 + 8) % 96}%`, ['--d' as string]: `${(i * 1.9) % 14}s`, ['--s' as string]: `${14 + (i % 4) * 8}px`, ['--t' as string]: `${12 + (i % 5) * 3}s` }} />)}
      </div>
      {win !== null && <div className="arc-win" role="status"><Anim c={WINS[win][0]} size={132} /><strong>{WINS[win][1]}</strong></div>}

      {slot ? createPortal(SOUND, slot) : SOUND}
    </>
  );
}
