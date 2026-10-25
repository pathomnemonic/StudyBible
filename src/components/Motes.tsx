import { useEffect, useRef } from 'react';

/**
 * A few huge, soft blobs of color drifting very slowly behind the text, like a screensaver turned down almost to nothing.
 * The colors come from the page's own theme and the book's atmosphere; it is off for reduced motion, paused when the tab is
 * hidden, and can be switched off in Reading settings.
 */
export default function Motes() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const g = cv.getContext('2d');
    if (!g) return;
    let w = 0, h = 0, raf = 0, last = 0;
    const dpr = 1; // blurry shapes do not need a sharp canvas
    const size = () => { w = Math.ceil(cv.clientWidth / 3); h = Math.ceil(cv.clientHeight / 3); cv.width = w * dpr; cv.height = h * dpr; };
    size();
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const colors = () => {
      const c = ['--aura-a', '--aura-b', '--aura-c', '--accent'].map(css).filter((x) => x && x !== 'transparent');
      return c.length ? c : ['rgba(150,130,255,.5)'];
    };
    let cols = colors();
    // each blob: a base position, an orbit and a speed, so the whole picture never repeats quickly
    const blobs = Array.from({ length: 4 }, (_, i) => ({ x: .2 + .6 * Math.random(), y: .2 + .6 * Math.random(), ax: .18 + .12 * Math.random(), ay: .14 + .12 * Math.random(), sx: .018 + .02 * Math.random(), sy: .015 + .02 * Math.random(), ph: Math.random() * 6.28, r: .38 + .22 * Math.random(), c: i }));
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 66) return; // about 15 frames a second is plenty for something this slow
      last = t;
      g.clearRect(0, 0, w, h);
      for (const b of blobs) {
        const X = (b.x + b.ax * Math.sin(t / 1000 * b.sx * 6.28 + b.ph)) * w;
        const Y = (b.y + b.ay * Math.cos(t / 1000 * b.sy * 6.28 + b.ph * 1.3)) * h;
        const R = b.r * Math.max(w, h) * (1 + .08 * Math.sin(t / 7000 + b.ph));
        const grd = g.createRadialGradient(X, Y, 0, X, Y, R);
        grd.addColorStop(0, cols[b.c % cols.length]);
        grd.addColorStop(1, 'transparent');
        g.globalAlpha = .55;
        g.fillStyle = grd;
        g.fillRect(0, 0, w, h);
      }
      g.globalAlpha = 1;
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) { cols = colors(); raf = requestAnimationFrame(tick); } };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('resize', size);
    const mo = new MutationObserver(() => { cols = colors(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-atm', 'data-theme'] });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="motes" aria-hidden="true" />;
}
