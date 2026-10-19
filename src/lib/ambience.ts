/**
 * Optional reading ambience, generated in the browser with the Web Audio API (filtered noise): nothing is downloaded and no
 * recording is involved. It starts only after a tap, stays quiet by default, and fades in and out. Rain, wind and a stream are
 * stylised, not field recordings.
 */
export type AmbienceKind = 'rain' | 'wind' | 'stream';

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

export function setAmbience(kind: AmbienceKind | 'off', volume: number) {
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

export function stopAmbience() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(0, now, 0.4);
  const prev = stop;
  stop = null;
  current = null;
  window.setTimeout(() => prev?.(), 1600);
}

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
