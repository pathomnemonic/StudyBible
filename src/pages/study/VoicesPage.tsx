import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLibraryIndex } from '../../data/content';

interface W { id: string; title: string; author: string; authorId?: string; year: string; period?: string }

const COUNCILS: [number, string][] = [[325, 'Nicaea I'], [381, 'Constantinople I'], [431, 'Ephesus'], [451, 'Chalcedon'], [787, 'Nicaea II'], [1545, 'Trent']];

const years = (s: string): [number, number] | null => {
  const n = [...s.matchAll(/\d{2,4}/g)].map((m) => +m[0]);
  return n.length ? [n[0], n[n.length - 1] < n[0] ? n[0] : n[n.length - 1]] : null;
};

const X0 = 190, X1 = 1000, ROW = 24, TOP = 72;
/** Whole timeline on a compressed scale: the first five centuries get most of the room, because most of the Fathers are there. */
const scale = (y: number) => {
  const t = Math.sqrt(Math.max(0, y - 80) / (1700 - 80));
  return X0 + t * (X1 - X0);
};

/** The writers in the library laid out in time, with the councils, so you can see who was writing when. */
export default function VoicesPage() {
  const [works, setWorks] = useState<W[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    getLibraryIndex().then((i) => setWorks(((i as { works?: W[] } | null)?.works ?? []) as W[]));
  }, []);
  const rows = useMemo(() => {
    const by = new Map<string, { name: string; items: { w: W; y: [number, number] }[] }>();
    for (const w of works) {
      const y = years(w.year);
      if (!y) continue;
      const k = w.authorId ?? w.author;
      if (!by.has(k)) by.set(k, { name: w.author, items: [] });
      by.get(k)!.items.push({ w, y });
    }
    return [...by.values()]
      .map((r) => ({ ...r, from: Math.min(...r.items.map((i) => i.y[0])), to: Math.max(...r.items.map((i) => i.y[1])) }))
      .sort((a, b) => a.from - b.from);
  }, [works]);
  const H = TOP + rows.length * ROW + 30;
  const ticks = [100, 200, 300, 400, 500, 600, 800, 1000, 1300, 1600];
  return (
    <div className="page">
      <h1>Voices through time</h1>
      <p className="lede">Each line is a writer in the library, from the first generation after the apostles to the early modern saints. A dot is a work; the line spans the years they wrote. Dates are approximate. Choose a dot to open the work. The vertical lines are the ecumenical councils.</p>
      <div className="voices-scroll">
        <svg viewBox={`0 0 ${X1 + 60} ${H}`} className="voices" role="group" aria-label="Timeline of Church writers" style={{ minWidth: 760 }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={scale(t)} x2={scale(t)} y1={TOP - 6} y2={H - 20} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={scale(t)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text)" opacity="0.7">{t}</text>
            </g>
          ))}
          {COUNCILS.map(([y, n], ci) => (
            <g key={n}>
              <line x1={scale(y)} x2={scale(y)} y1={TOP - 4} y2={H - 20} stroke="var(--accent)" opacity="0.55" />
              <text x={scale(y)} y={TOP - 12 - (ci % 3) * 12} textAnchor="middle" fontSize="11" fill="var(--accent)">{n}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const y = TOP + i * ROW + 10;
            return (
              <g key={r.name}>
                <text x={X0 - 8} y={y + 4} textAnchor="end" fontSize="13" fill="var(--text)" opacity={hover && hover !== r.name ? 0.4 : 1}>{r.name.replace(/ and .*/, '').replace(' the Syrian', '').replace(' of the Resurrection', '').slice(0, 26)}</text>
                <line x1={scale(r.from)} x2={scale(Math.max(r.to, r.from + 6))} y1={y} y2={y} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity={hover && hover !== r.name ? 0.25 : 0.7} />
                {r.items.map(({ w, y: yy }) => (
                  <Link key={w.id} to={`/study/works/${w.id}`} onMouseEnter={() => setHover(r.name)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(r.name)} onBlur={() => setHover(null)} aria-label={`${w.title}, ${w.year}`}>
                    <circle cx={scale((yy[0] + yy[1]) / 2)} cy={y} r="5.5" fill="var(--bg, #000)" stroke="var(--accent)" strokeWidth="2" />
                    <title>{`${w.title} (${w.year})`}</title>
                  </Link>
                ))}
              </g>
            );
          })}
          
        </svg>
      </div>
      <p className="muted small">The scale is compressed after the fifth century so the first Fathers are not crowded together. Dates are those given in the library entry for each work.</p>
    </div>
  );
}
