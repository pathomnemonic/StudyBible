import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, getBook } from '../../lib/canon';
import { bookMatrix, pairLinks, topLinks, type BookMatrix } from '../../study/bookLinks';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const GROUP_HUE: Record<string, number> = {};
['Pentateuch', 'Historical', 'Wisdom', 'Prophets', 'Gospels', 'Acts', 'Pauline', 'Catholic', 'Revelation'].forEach((g, i) => (GROUP_HUE[g] = i * 38));

/** Every book as a star in a slowly turning sphere. Drag to turn it, choose a star to light up the books it is bound to. */
export default function UniversePage() {
  const [m, setM] = useState<BookMatrix | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ry: 0.4, rx: 0.25, vy: reduced() ? 0 : 0.0016, drag: false, lx: 0, ly: 0, moved: 0 });
  const proj = useRef<{ id: string; x: number; y: number; z: number; r: number }[]>([]);
  useEffect(() => {
    bookMatrix().then(setM);
  }, []);

  // each testament on its own hemisphere, books spread along a spiral in canon order
  const pts = useMemo(() => {
    const ot = BOOKS.filter((b) => b.testament === 'OT');
    const nt = BOOKS.filter((b) => b.testament === 'NT');
    const place = (list: typeof BOOKS, sign: number) =>
      list.map((b, i) => {
        const t = (i + 0.5) / list.length;
        const phi = Math.acos(1 - t * 0.9) ;
        const th = i * 2.399963;
        return { id: b.id, x: Math.sin(phi) * Math.cos(th), y: sign * Math.cos(phi), z: Math.sin(phi) * Math.sin(th), group: b.group };
      });
    return [...place(ot, 1), ...place(nt, -1)];
  }, []);
  const links = useMemo(() => (m ? pairLinks(m, 260) : []), [m]);
  const top = m && sel ? topLinks(m, sel) : [];
  const near = useMemo(() => new Set(top.map((t) => t[0])), [top]);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    const byId = new Map(pts.map((p) => [p.id, p]));
    const cs = getComputedStyle(document.documentElement);
    const draw = () => {
      const s = st.current;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const W = c.clientWidth, H = c.clientHeight;
      if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!s.drag) s.ry += s.vy;
      const R = Math.min(W, H) * 0.38;
      const cy = Math.cos(s.ry), sy = Math.sin(s.ry), cx = Math.cos(s.rx), sx = Math.sin(s.rx);
      const P = (p: { x: number; y: number; z: number }) => {
        const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
        const k = 1 / (1 - z2 * 0.35);
        return { x: W / 2 + x1 * R * k, y: H / 2 + y2 * R * k, z: z2, k };
      };
      const pr = new Map(pts.map((p) => [p.id, P(p)]));
      const accent = cs.getPropertyValue('--accent').trim() || '#b9a8ff';
      const text = cs.getPropertyValue('--text').trim() || '#fff';
      for (const l of links) {
        const a = pr.get(l.a)!, b = pr.get(l.b)!;
        const on = sel && (l.a === sel || l.b === sel);
        if (sel && !on) continue;
        ctx.globalAlpha = (sel ? 0.35 + l.n * 0.6 : 0.05 + l.n * 0.3) * (0.4 + 0.3 * (a.z + b.z + 2));
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.5 + l.n * 1.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(W / 2 + (a.x + b.x - W) * 0.25, H / 2 + (a.y + b.y - H) * 0.25, b.x, b.y);
        ctx.stroke();
      }
      const out: typeof proj.current = [];
      [...pts].sort((a, b) => pr.get(a.id)!.z - pr.get(b.id)!.z).forEach((p) => {
        const q = pr.get(p.id)!;
        const on = sel === p.id || near.has(p.id);
        const r = (on ? 5.5 : 3.2) * q.k;
        ctx.globalAlpha = sel && !on ? 0.25 : 0.45 + 0.55 * (q.z + 1) / 2;
        ctx.fillStyle = `hsl(${GROUP_HUE[p.group] ?? 200} 70% 72%)`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, 7);
        ctx.fill();
        if (on || q.z > 0.55) {
          ctx.globalAlpha = on ? 1 : 0.7;
          ctx.fillStyle = text;
          ctx.font = `${on ? 600 : 400} ${11 * q.k}px system-ui, sans-serif`;
          ctx.fillText(getBook(p.id).abbr, q.x + r + 3, q.y + 3);
        }
        out.push({ id: p.id, x: q.x, y: q.y, z: q.z, r: Math.max(r, 10) });
      });
      proj.current = out;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [pts, links, sel, near]);

  const pick = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best: string | null = null, bd = 1e9;
    for (const p of proj.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < p.r + 6 && d < bd) { bd = d; best = p.id; }
    }
    return best;
  };
  return (
    <div className="page">
      <h1>Scripture universe</h1>
      <p className="lede">The whole canon as a sphere of stars: Old Testament above, New Testament below, colour by kind of book. Drag to turn it. Choose a star, or pick a book below, to see the books it is bound to by cross-references.</p>
      <canvas
        ref={cv}
        className="universe"
        role="img"
        aria-label="Interactive sphere of the 73 books. Use the list below the picture to choose a book."
        onPointerDown={(e) => { const s = st.current; s.drag = true; s.lx = e.clientX; s.ly = e.clientY; s.moved = 0; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { const s = st.current; if (!s.drag) return; s.ry += (e.clientX - s.lx) * 0.006; s.rx = Math.max(-1.2, Math.min(1.2, s.rx - (e.clientY - s.ly) * 0.006)); s.moved += Math.abs(e.clientX - s.lx) + Math.abs(e.clientY - s.ly); s.lx = e.clientX; s.ly = e.clientY; }}
        onPointerUp={(e) => { const s = st.current; s.drag = false; if (s.moved < 6) { const b = pick(e); setSel(b === sel ? null : b); } }}
      />
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="muted small" htmlFor="uni-book">Choose a book</label>
        <select id="uni-book" value={sel ?? ''} onChange={(e) => setSel(e.target.value || null)}>
          <option value="">None</option>
          {BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {sel && (
          <>
            <span className="small">Bound most strongly to: {top.map(([t], i) => <span key={t}>{i ? ', ' : ''}<button className="linklike" onClick={() => setSel(t)}>{getBook(t).name}</button></span>)}.</span>
            <Link className="btn small" to={`/read/dra/${sel}/1`}>Read {getBook(sel).name}</Link>
          </>
        )}
      </div>
    </div>
  );
}
