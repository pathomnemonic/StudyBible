import { getSettings } from './store';

/** What a tap does, like a drop falling into still water: two soft rings spread out from the fingertip, and (if switched on) a quiet "plip". */
const TARGETS = '.btn, .tab, .chip, .icon-btn, .hub-tile, .fold > summary, .lod, .welcome-chip, .cta-main, .vis-chips button, .vis-rail button';

let ctx: AudioContext | null = null;
/** a short falling tone, like a drop landing: a sine that glides down and fades, kept very quiet */
function plip() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(920 + Math.random() * 120, t);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.3);
  } catch { /* audio not available */ }
}

export function dropAt(x: number, y: number) {
  const s = getSettings();
  const still = s.motion === 'none' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (s.tapSound) plip();
  if (still || !s.tapRipple) return;
  const wrap = document.createElement('span');
  wrap.className = 'drop';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.left = `${x}px`;
  wrap.style.top = `${y}px`;
  wrap.innerHTML = '<i></i><i></i><i></i>';
  document.body.appendChild(wrap);
  window.setTimeout(() => wrap.remove(), 1400);
}

/**
 * A drop only falls on a real tap: a finger that lands and lifts in place. A touch that turns into a scroll or a swipe (the browser then cancels the
 * pointer) makes nothing, and neither does a long press, so scrolling never sets anything off.
 */
export function installRipples(): () => void {
  let start: { x: number; y: number; t: number; el: HTMLElement; id: number } | null = null;
  const down = (e: PointerEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.(TARGETS) as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled) { start = null; return; }
    start = { x: e.clientX, y: e.clientY, t: performance.now(), el, id: e.pointerId };
  };
  const up = (e: PointerEvent) => {
    const s0 = start; start = null;
    if (!s0 || s0.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - s0.x, e.clientY - s0.y) > 10 || performance.now() - s0.t > 600) return;
    dropAt(e.clientX, e.clientY);
  };
  const cancel = () => { start = null; };
  document.addEventListener('pointerdown', down, { passive: true });
  document.addEventListener('pointerup', up, { passive: true });
  document.addEventListener('pointercancel', cancel, { passive: true });
  window.addEventListener('scroll', cancel, { passive: true, capture: true });
  return () => {
    document.removeEventListener('pointerdown', down);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', cancel);
    window.removeEventListener('scroll', cancel, true);
  };
}
