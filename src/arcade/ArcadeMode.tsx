import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '@fontsource/lilita-one';
import '@fontsource-variable/fredoka';
import '../styles/arcade.css';
import { blip, burst, ring, setSound, soundOn } from './fx';

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
  useEffect(() => {
    if (!on) return;
    document.documentElement.dataset.arcade = '1';
    return () => { delete document.documentElement.dataset.arcade; };
  }, [on]);
  useEffect(() => {
    if (!on) return;
    // a finished game: any result panel that appears gets confetti once
    const seen = new WeakSet<Element>();
    const finish = '.ws-end, .dw-results, .tv-over, .q-win, .vb-win, [data-win]';
    const obs = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        const el = n.matches(finish) ? n : n.querySelector(finish);
        if (el && !seen.has(el)) { seen.add(el); burst(); blip('win'); }
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
  return (
    <>
      <div className="arc-bg" aria-hidden="true">
        <i className="arc-blob b1" /><i className="arc-blob b2" /><i className="arc-blob b3" />
        {Array.from({ length: 14 }, (_, i) => <b key={i} className={`arc-shape s${i % 5}`} style={{ ['--x' as string]: `${(i * 37 + 8) % 96}%`, ['--d' as string]: `${(i * 1.9) % 14}s`, ['--s' as string]: `${14 + (i % 4) * 8}px`, ['--t' as string]: `${12 + (i % 5) * 3}s` }} />)}
      </div>
      <button type="button" className="arc-sound" aria-pressed={sound} aria-label={sound ? 'Sound on. Tap to turn off' : 'Sound off. Tap to turn on'} onClick={() => { const next = !sound; setSound(next); setSoundState(next); if (next) blip('good'); }}>{sound ? '🔊' : '🔇'}</button>
    </>
  );
}
