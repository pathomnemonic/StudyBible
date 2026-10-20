/**
 * Reading ambience. Real recordings (public-domain or openly licensed; see public/audio/index.json for each track's source and
 * licence) played through an <audio> element with fades, as a shuffled playlist per category or a single looping nature track.
 * If the recordings cannot be loaded, rain, wind and a stream are synthesised in the browser instead (filtered noise).
 * Browsers only allow sound after a tap or key press, so a sound that is on by default starts at the first one.
 */
export type AmbienceKind = 'rain' | 'wind' | 'stream';
export type SoundKind = 'off' | AmbienceKind | 'nature' | 'music' | 'classical' | 'chant';
export interface Track { id: string; file: string; title: string; category: 'nature' | 'music' | 'classical' | 'chant'; artist?: string; license: string; licenseUrl?: string; sourceUrl?: string; note?: string }

const BASE = (import.meta as any).env?.BASE_URL ?? '/';
let manifest: Promise<Track[]> | null = null;
export const loadTracks = (): Promise<Track[]> =>
  (manifest ??= fetch(`${BASE}audio/index.json`).then((r) => (r.ok ? r.json() : { tracks: [] })).then((j) => j.tracks as Track[]).catch(() => []));
const SINGLE: Record<AmbienceKind, string> = { rain: 'nature-summer-rain', wind: 'nature-wind-trees', stream: 'nature-mountain-stream' };

let el: HTMLAudioElement | null = null;
let want: { kind: SoundKind; volume: number } = { kind: 'off', volume: 0.25 };
let queue: Track[] = [];
let fadeTimer = 0;
let unlock: (() => void) | null = null;
const listeners = new Set<(t: Track | null) => void>();
let nowPlaying: Track | null = null;
const announce = (t: Track | null) => { nowPlaying = t; listeners.forEach((f) => f(t)); };
/** Subscribe to the track that is playing (for a “now playing” credit). Returns an unsubscribe. */
export function onTrack(f: (t: Track | null) => void) { listeners.add(f); f(nowPlaying); return () => { listeners.delete(f); }; }

const level = (v: number) => Math.min(Math.max(v, 0), 0.6) * 1.2;
function fadeTo(target: number, ms: number, done?: () => void) {
  if (!el) return;
  window.clearInterval(fadeTimer);
  const a = el;
  const from = a.volume;
  const t0 = performance.now();
  fadeTimer = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.min(1, Math.max(0, from + (target - from) * k));
    if (k >= 1) { window.clearInterval(fadeTimer); done?.(); }
  }, 50);
}
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function playNext(loopSingle: boolean) {
  if (!queue.length) return;
  const t = queue[0];
  el ??= new Audio();
  const a = el;
  a.onended = null;
  a.loop = loopSingle;
  a.src = `${BASE}audio/${t.file}`;
  a.volume = 0;
  a.onended = () => { queue.push(queue.shift()!); playNext(loopSingle); };
  a.play().then(() => { announce(t); fadeTo(level(want.volume), 2500); }).catch(() => {
    // blocked until the first tap or key press
    if (unlock) return;
    unlock = () => {
      window.removeEventListener('pointerdown', unlock!, true);
      window.removeEventListener('keydown', unlock!, true);
      unlock = null;
      if (want.kind !== 'off') playNext(loopSingle);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
  });
}

async function startReal(kind: SoundKind): Promise<boolean> {
  const tracks = await loadTracks();
  const single = kind in SINGLE ? tracks.find((t) => t.id === SINGLE[kind as AmbienceKind]) : undefined;
  const list = single ? [single] : tracks.filter((t) => t.category === kind);
  if (!list.length || want.kind !== kind) return false;
  queue = single ? list : shuffle(list);
  playNext(!!single);
  return true;
}

function stopReal() {
  window.clearInterval(fadeTimer);
  if (unlock) { window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); unlock = null; }
  if (!el) return;
  const a = el;
  a.onended = null;
  fadeTo(0, 1200, () => { a.pause(); });
  announce(null);
  queue = [];
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let stop: (() => void) | null = null;
let current: AmbienceKind | null = null;

function noise(c: AudioContext, kind: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w;
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function build(c: AudioContext, kind: AmbienceKind, out: AudioNode): () => void {
  const nodes: AudioScheduledSourceNode[] = [];
  const hush = c.createGain();
  hush.connect(out);
  if (kind === 'rain') {
    const n = noise(c, 'pink');
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7500;
    n.connect(hp).connect(lp).connect(hush);
    hush.gain.value = 0.9;
    nodes.push(n);
  } else if (kind === 'wind') {
    const n = noise(c, 'brown');
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.7;
    bp.frequency.value = 450;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = c.createGain();
    depth.gain.value = 260;
    lfo.connect(depth).connect(bp.frequency);
    const swell = c.createOscillator();
    swell.frequency.value = 0.045;
    const swellDepth = c.createGain();
    swellDepth.gain.value = 0.35;
    swell.connect(swellDepth).connect(hush.gain);
    hush.gain.value = 0.65;
    n.connect(bp).connect(hush);
    nodes.push(n, lfo, swell);
  } else {
    // stream: bright filtered noise with a slowly wandering band, like water over stones
    const n = noise(c, 'white');
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.value = 1800;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.35;
    const depth = c.createGain();
    depth.gain.value = 700;
    lfo.connect(depth).connect(bp.frequency);
    const g = c.createGain();
    g.gain.value = 0.5;
    n.connect(bp).connect(g).connect(hush);
    hush.gain.value = 0.8;
    nodes.push(n, lfo);
  }
  nodes.forEach((x) => x.start());
  return () => {
    nodes.forEach((x) => {
      try {
        x.stop();
      } catch {
        /* already stopped */
      }
    });
    hush.disconnect();
  };
}

function setSynth(kind: AmbienceKind | 'off', volume: number) {
  if (kind === 'off') {
    stopAmbience();
    return;
  }
  if (typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  void ctx.resume();
  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  if (current !== kind) {
    // crossfade: quickly out, rebuild, slowly in
    master.gain.setTargetAtTime(0, now, 0.15);
    const prev = stop;
    window.setTimeout(() => {
      prev?.();
      stop = build(ctx!, kind, master!);
      master!.gain.setTargetAtTime(Math.min(Math.max(volume, 0), 0.6) * 0.5, ctx!.currentTime, 1.2);
    }, prev ? 350 : 0);
    current = kind;
  } else {
    master.gain.setTargetAtTime(Math.min(Math.max(volume, 0), 0.6) * 0.5, now, 0.4);
  }
}

function stopSynth() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(0, now, 0.4);
  const prev = stop;
  stop = null;
  current = null;
  window.setTimeout(() => prev?.(), 1600);
}

let synthFallback: AmbienceKind | null = null;
/** Start, change or stop the ambience. `kind` is a playlist category, a single nature sound or 'off'. */
export function setAmbience(kind: SoundKind, volume: number) {
  const changed = kind !== want.kind;
  want = { kind, volume };
  if (kind === 'off') { stopReal(); stopSynth(); synthFallback = null; return; }
  if (!changed) {
    if (synthFallback) setSynth(synthFallback, volume);
    else if (el && !el.paused) fadeTo(level(volume), 400);
    return;
  }
  stopSynth(); synthFallback = null;
  stopReal();
  startReal(kind).then((ok) => {
    if (ok || want.kind !== kind) return;
    if (kind === 'rain' || kind === 'wind' || kind === 'stream') { synthFallback = kind; setSynth(kind, want.volume); }
  });
}
export function stopAmbience() { setAmbience('off', want.volume); }

/** A soft, single bell for the end of a quiet reading session. */
export function softBell() {
  if (typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  void ctx.resume();
  const t = ctx.currentTime;
  for (const [f, g] of [[528, 0.12], [1056, 0.05], [1584, 0.025]] as const) {
    const o = ctx.createOscillator();
    const e = ctx.createGain();
    o.frequency.value = f;
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(g, t + 0.02);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    o.connect(e).connect(ctx.destination);
    o.start(t);
    o.stop(t + 4.6);
  }
}
