import { useEffect, useRef } from 'react';

/** A few slow, soft points of light drifting behind the text. Off for reduced motion; paused when the tab is hidden. */
export default function Motes() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const g = cv.getContext('2d');
    if (!g) return;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const N = 26;
    const m = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.6, vx: (Math.random() - .5) * .006, vy: -0.004 - Math.random() * .01, ph: Math.random() * 6.28, sp: .15 + Math.random() * .3 }));
    const color = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c9a24a';
    let col = color();
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      g.clearRect(0, 0, w, h);
      for (const p of m) {
        p.x += p.vx * dt * 6 + Math.sin(t / 4000 * p.sp + p.ph) * 0.00008;
        p.y += p.vy * dt * 6;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05; else if (p.x > 1.05) p.x = -0.05;
        const a = (0.5 + 0.5 * Math.sin(t / 1000 * p.sp + p.ph)) * 0.32;
        const X = p.x * w, Y = p.y * h;
        const grd = g.createRadialGradient(X, Y, 0, X, Y, p.r * 5);
        grd.addColorStop(0, col); grd.addColorStop(1, 'transparent');
        g.globalAlpha = a;
        g.fillStyle = grd;
        g.beginPath(); g.arc(X, Y, p.r * 5, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); col = color(); raf = requestAnimationFrame(tick); } };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="motes" aria-hidden="true" />;
}
