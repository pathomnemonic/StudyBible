/**
 * Small, dependency-free game effects: a confetti burst, a ring where you tap, and sound blips (on unless the player turns them off).
 * Nothing here runs under reduced motion, and the sounds are synthesized, so there are no audio files.
 */
import { buzz } from '../lib/haptics';

export const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'none');
const COLORS = ['#ffd23f', '#ff4fa3', '#2ee6d6', '#ff8a2b', '#8bea3a', '#7b5cff', '#ffffff'];

export function burst(x = window.innerWidth / 2, y = window.innerHeight * 0.35, count = 70, colors: readonly string[] = COLORS) {
  if (reduced()) return;
  const layer = document.createElement('div');
  layer.className = 'arc-confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const power = 120 + Math.random() * 260;
    p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(angle) * power}px;--dy:${Math.sin(angle) * power - 160}px;--r:${Math.random() * 900 - 450}deg;--t:${900 + Math.random() * 900}ms;width:${6 + Math.random() * 7}px;height:${8 + Math.random() * 10}px;border-radius:${Math.random() < 0.4 ? '50%' : '2px'}`;
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
/** on by default: only an explicit choice to turn it off (stored as '0') silences the games */
export const soundOn = () => { try { return localStorage.getItem(SOUND_KEY) !== '0'; } catch { return true; } };
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
function sweep(f0: number, f1: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.1) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.12, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
/** The sounds of a Basilion round, in the order they happen: the answer is locked in, rises, lands (brighter for a rarer answer), the next question appears, the climb ends. */
export type Cue = 'submit' | 'rise' | 'land' | 'next' | 'final' | 'miss';
export function cue(kind: Cue, tier = 1) {
  if (!soundOn()) return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    if (kind === 'submit') { tone(392, 0, 0.09, 'triangle', 0.09); tone(587, 0.07, 0.14, 'triangle', 0.09); }
    else if (kind === 'rise') { sweep(180, 760, 0, 1.9, 'sine', 0.085); sweep(270, 1140, 0.05, 1.8, 'triangle', 0.025); }
    else if (kind === 'land') {
      tone(110, 0, 0.22, 'sine', 0.14); // the soft thud of arriving
      const notes = [[523], [523, 659], [523, 659, 784], [523, 659, 784, 988], [523, 659, 784, 1047, 1319], [523, 659, 784, 1047, 1319, 1568]][Math.max(1, Math.min(6, tier)) - 1];
      notes.forEach((f, i) => tone(f, 0.05 + i * 0.07, 0.3 + tier * 0.06, 'triangle', 0.075));
    }
    else if (kind === 'miss') { tone(247, 0, 0.18, 'sawtooth', 0.05); tone(196, 0.14, 0.3, 'sawtooth', 0.05); }
    else if (kind === 'next') { tone(659, 0, 0.07, 'sine', 0.06); tone(880, 0.08, 0.12, 'sine', 0.06); }
    else { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.5, 'triangle', 0.1)); tone(262, 0, 1.1, 'sine', 0.08); }
  } catch { /* no audio available */ }
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
