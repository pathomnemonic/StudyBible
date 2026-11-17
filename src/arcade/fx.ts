/**
 * Small, dependency-free game effects: a confetti burst, a ring where you tap, and optional sound blips (off until the player turns them on).
 * Nothing here runs under reduced motion, and the sounds are synthesized, so there are no audio files.
 */
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'none');
const COLORS = ['#ffd23f', '#ff4fa3', '#2ee6d6', '#ff8a2b', '#8bea3a', '#7b5cff', '#ffffff'];

export function burst(x = window.innerWidth / 2, y = window.innerHeight * 0.35, count = 70) {
  if (reduced()) return;
  const layer = document.createElement('div');
  layer.className = 'arc-confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const power = 120 + Math.random() * 260;
    p.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % COLORS.length]};--dx:${Math.cos(angle) * power}px;--dy:${Math.sin(angle) * power - 160}px;--r:${Math.random() * 900 - 450}deg;--t:${900 + Math.random() * 900}ms;width:${6 + Math.random() * 7}px;height:${8 + Math.random() * 10}px;border-radius:${Math.random() < 0.4 ? '50%' : '2px'}`;
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 2000);
}

export function ring(x: number, y: number) {
  if (reduced()) return;
  const r = document.createElement('i');
  r.className = 'arc-ring';
  r.style.left = `${x}px`; r.style.top = `${y}px`;
  document.body.appendChild(r);
  window.setTimeout(() => r.remove(), 600);
}

/* ---- sound ---- */
const SOUND_KEY = 'sb:arcade:sound';
export const soundOn = () => { try { return localStorage.getItem(SOUND_KEY) === '1'; } catch { return false; } };
export const setSound = (on: boolean) => { try { localStorage.setItem(SOUND_KEY, on ? '1' : '0'); } catch { /* private mode */ } };
let ctx: AudioContext | null = null;
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', gain = 0.12) {
  if (!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.02);
}
export type Blip = 'tap' | 'good' | 'bad' | 'win';
export function blip(kind: Blip) {
  if (!soundOn()) return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    if (kind === 'tap') tone(520, 0, 0.06, 'triangle', 0.07);
    else if (kind === 'good') { tone(660, 0, 0.1); tone(880, 0.09, 0.16); }
    else if (kind === 'bad') { tone(220, 0, 0.16, 'sawtooth', 0.07); tone(165, 0.12, 0.2, 'sawtooth', 0.07); }
    else { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22)); }
  } catch { /* no audio available */ }
}
