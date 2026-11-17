/**
 * Small, dependency-free game effects: a confetti burst, a ring where you tap, and optional sound blips (off until the player turns them on).
 * Nothing here runs under reduced motion, and the sounds are synthesized, so there are no audio files.
 */
import { buzz } from '../lib/haptics';

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
  // a small buzz on a phone whose owner switched haptics on in settings: short for a tap, longer for a right or wrong answer
  buzz(kind === 'tap' ? 6 : kind === 'bad' ? 40 : kind === 'good' ? 18 : 60);
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

/** Counts the number in an element's first text node up from zero, then puts that text back exactly (other child elements are never touched). Not under reduced motion. */
export function countUp(el: HTMLElement, ms = 900) {
  if (reduced()) return;
  const node = el.firstChild;
  if (!node || node.nodeType !== 3) return;
  const original = node.textContent ?? '';
  if (!/^\d+$/.test(original.trim())) return;
  const target = parseInt(original, 10);
  if (target < 2 || target > 100000) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    if (!node.isConnected) return;
    node.textContent = t < 1 ? String(Math.round(target * (1 - Math.pow(1 - t, 3)))) : original;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
