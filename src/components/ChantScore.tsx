import { useEffect, useRef, useState } from 'react';

/** The special-character font Exsurge draws ℣ ℟ ✠ with. Loaded once, only when a score is shown. */
let fontReady: Promise<void> | null = null;
async function loadFont() {
  fontReady ??= (async () => {
    try {
      const url = (await import('@vagdur/exsurge/assets/fonts/ExsurgeChar.otf?url')).default as string;
      const f = new FontFace('Exsurge Characters', `url(${url})`);
      await f.load(); document.fonts.add(f);
    } catch { /* the glyphs fall back to the browser's font */ }
  })();
  return fontReady;
}

/** Draws a GABC score as square-note notation, in the browser (Exsurge, MIT). The library is a separate chunk, fetched only when a score is opened. */
export default function ChantScore({ gabc, label }: { gabc: string; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    let live = true, ro: ResizeObserver | undefined, timer = 0;
    (async () => {
      try {
        const [ex] = await Promise.all([import('@vagdur/exsurge'), loadFont()]);
        if (!live || !host.current) return;
        const ctxt = new ex.ChantContext();
        const score = ex.Gabc.createScoreFromSource(ctxt, gabc, true);
        const draw = () => {
          const el = host.current; if (!el) return;
          const w = Math.max(240, el.clientWidth);
          score.performLayout(ctxt);
          score.layoutChantLines(ctxt, w, () => {
            if (!live || !host.current) return;
            const svg = score.createSvgNode(ctxt);
            svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label);
            (svg as unknown as HTMLElement).style.maxWidth = '100%';
            host.current.replaceChildren(svg);
            setState('ready');
          });
        };
        draw();
        ro = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(draw, 250); });
        ro.observe(host.current);
      } catch { if (live) setState('failed'); }
    })();
    return () => { live = false; window.clearTimeout(timer); ro?.disconnect(); };
  }, [gabc, label]);
  return (
    <div>
      <div ref={host} className="chant-score" data-state={state} />
      {state === 'loading' && <p className="muted small" role="status">Drawing the notation…</p>}
      {state === 'failed' && <p className="muted small" role="alert">The notation could not be drawn here. The Latin text on this page is unaffected.</p>}
    </div>
  );
}
