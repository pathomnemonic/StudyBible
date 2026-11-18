import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BasilicaScene from './BasilicaScene';
import { HEAVEN_M } from './basilicaHeights';
import type { BasilicaScene3D } from './basilica3d';

/**
 * Picks how the basilica is drawn: a real-time 3D scene (three.js, loaded only when needed) when the device can do WebGL, otherwise the flat vector drawing in
 * BasilicaScene. Automated browsers get the vector drawing too, so tests are not slowed by software rendering, unless localStorage "cathology.bas3d" is "force".
 */
const canWebGL = () => {
  try {
    const flag = localStorage.getItem('cathology.bas3d');
    if (flag === 'off') return false;
    if (navigator.webdriver && flag !== 'force') return false;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData && flag !== 'force') return false;
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
};

export default function BasilicaStage({ height, begun }: { height: number; begun: boolean }) {
  const [mode, setMode] = useState<'pending' | '3d' | 'flat'>('pending');
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BasilicaScene3D | null>(null);
  const p = Math.max(0, Math.min(1, height / HEAVEN_M));
  useEffect(() => { setMode(canWebGL() ? '3d' : 'flat'); }, []);
  useEffect(() => {
    if (mode !== '3d') return;
    let dead = false; let ro: ResizeObserver | null = null;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'none';
    import('./basilica3d').then(({ BasilicaScene3D }) => {
      if (dead || !ref.current) return;
      try {
        const s = new BasilicaScene3D(ref.current, Boolean(still)); scene.current = s; s.setProgress(p);
        ro = new ResizeObserver(() => s.resize()); ro.observe(document.body);
      } catch { setMode('flat'); }
    }).catch(() => setMode('flat'));
    return () => { dead = true; ro?.disconnect(); scene.current?.dispose(); scene.current = null; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { scene.current?.setProgress(p); }, [p]);
  if (mode === 'flat') return <BasilicaScene height={height} begun={begun} />;
  if (mode === 'pending') return null;
  return createPortal(<canvas ref={ref} className="bas-3d" aria-hidden="true" />, document.body);
}
