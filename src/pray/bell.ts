let ctx: AudioContext | null = null;

/** A soft bell struck `strokes` times, made in the browser (no audio files). The Angelus rings three, three, three and then nine. */
export function bell(strokes = 1, gap = 1.6): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx ??= new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.05;
    for (let k = 0; k < strokes; k++) {
      const t = t0 + k * gap;
      [[1, 0.5, 3.2], [2.01, 0.28, 2.4], [2.76, 0.18, 1.8], [5.4, 0.09, 1.1], [8.93, 0.04, 0.6]].forEach(([mul, amp, len]) => {
        const o = ctx!.createOscillator();
        const g = ctx!.createGain();
        o.type = 'sine';
        o.frequency.value = 262 * mul;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp * 0.35, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(ctx!.destination);
        o.start(t);
        o.stop(t + len + 0.05);
      });
    }
  } catch {
    /* audio blocked or unsupported: the prayer carries on silently */
  }
}
