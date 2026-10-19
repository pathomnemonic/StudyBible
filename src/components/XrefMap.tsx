import { useState } from 'react';
import type { StudyItem } from '../study/providers';
import { parseRefId } from '../lib/refs';
import { getBook } from '../lib/canon';

const COLORS = ['#8a2f39', '#3f6a8a', '#2f7d5b', '#6b5a9a', '#a07a1c', '#b4631f', '#5b7a4f', '#9a6a8a'];

/** A radial map of a verse's cross-references. Each spoke is a passage; colour groups the book; click one to open it. */
export default function XrefMap({ items, center, onOpen }: { items: StudyItem[]; center: string; onOpen: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const list = items.filter((i) => i.xrefTarget).slice(0, 28);
  if (!list.length) return null;
  const W = 420;
  const cx = W / 2;
  const cy = W / 2;
  const R = 150;
  const books = [...new Set(list.map((i) => parseRefId(i.xrefTarget!)?.book ?? ''))];
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="xref-map" role="group" aria-label={`Cross-references from ${center}`}>
      {list.map((i, n) => {
        const a = (2 * Math.PI * n) / list.length - Math.PI / 2;
        const x = cx + R * Math.cos(a);
        const y = cy + R * Math.sin(a);
        const r = parseRefId(i.xrefTarget!);
        const color = COLORS[books.indexOf(r?.book ?? '') % COLORS.length];
        const w = Math.max(1, Math.min(4, (i.votes ?? 1) / 20));
        return (
          <g key={i.id} onMouseEnter={() => setHover(i.id)} onMouseLeave={() => setHover(null)} onClick={() => onOpen(i.xrefTarget!)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={i.title} onKeyDown={(e) => e.key === 'Enter' && onOpen(i.xrefTarget!)}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={w} opacity={hover && hover !== i.id ? 0.15 : 0.6} />
            <circle cx={x} cy={y} r={hover === i.id ? 9 : 6} fill={color} />
            <text x={x + (x > cx ? 10 : -10)} y={y + 3} fontSize="9.5" textAnchor={x > cx ? 'start' : 'end'} fill="var(--text)" fontWeight={hover === i.id ? 700 : 400}>
              {r ? `${getBook(r.book).abbr ?? r.book} ${r.c1}${r.v1 ? ':' + r.v1 : ''}` : i.title}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={26} fill="var(--accent)" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9.5" fill="var(--accent-text)" fontWeight="700">{center.length > 12 ? center.slice(0, 11) + '…' : center}</text>
    </svg>
  );
}
