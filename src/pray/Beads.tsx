import { useMemo } from 'react';
import type { Plan } from './plan';

const W = 360, H = 500, CX = 180, CY = 172, R = 132;

interface Pt { x: number; y: number }

/** Where each bead sits: the loop of fifty-five around a circle with the centerpiece at the bottom, and the tail hanging below it. */
export function positions(n: number): Pt[] {
  const p: Pt[] = new Array(n);
  const loopCount = n - 7 + 1; // loop beads plus the centerpiece
  const at = (k: number): Pt => { const a = ((90 + (k * 360) / loopCount) * Math.PI) / 180; return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }; };
  p[6] = at(0);
  for (let i = 7; i < n; i++) p[i] = at(i - 6);
  const cy = CY + R;
  p[5] = { x: CX, y: cy + 24 };
  p[4] = { x: CX, y: cy + 44 };
  p[3] = { x: CX, y: cy + 62 };
  p[2] = { x: CX, y: cy + 80 };
  p[1] = { x: CX, y: cy + 104 };
  p[0] = { x: CX, y: cy + 148 };
  return p;
}

/** The rosary as a picture. The bead being prayed on glows, beads already prayed are filled, and tapping a bead jumps to it. */
export default function Beads({ plan, step, onJump }: { plan: Plan; step: number; onJump: (stepIndex: number) => void }) {
  const pts = useMemo(() => positions(plan.slots.length), [plan.slots.length]);
  const first = useMemo(() => { const m = new Map<number, number>(); plan.steps.forEach((s, i) => { if (!m.has(s.slot)) m.set(s.slot, i); }); return m; }, [plan]);
  const last = useMemo(() => { const m = new Map<number, number>(); plan.steps.forEach((s, i) => m.set(s.slot, i)); return m; }, [plan]);
  const now = plan.steps[step].slot;
  const done = (slot: number) => (last.get(slot) ?? -1) < step;
  const cls = (slot: number) => (slot === now ? 'bead cur' : done(slot) ? 'bead done' : 'bead');
  return (
    <svg className="rosary-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Rosary beads. Praying bead ${now + 1} of ${plan.slots.length}.`}>
      <circle cx={CX} cy={CY} r={R} className="bead-string" />
      <line x1={CX} y1={CY + R} x2={CX} y2={CY + R + 148} className="bead-string" />
      {plan.slots.map((s, i) => {
        const { x, y } = pts[i];
        const jump = () => { const j = first.get(i); if (j !== undefined) onJump(j); };
        if (s.zone === 'cross') {
          return (
            <g key={i} className={cls(i)} onClick={jump}>
              <rect x={x - 5} y={y - 26} width="10" height="52" rx="3" className="bead-body" />
              <rect x={x - 19} y={y - 13} width="38" height="10" rx="3" className="bead-body" />
            </g>
          );
        }
        if (s.zone === 'center') return <g key={i} className={cls(i)} onClick={jump}><circle cx={x} cy={y} r="13" className="bead-body" /><circle cx={x} cy={y} r="6.5" className="bead-inner" /></g>;
        if (s.zone === 'link') return <g key={i} className={cls(i)} onClick={jump}><rect x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} className="bead-body" /></g>;
        const big = s.zone === 'big' || s.zone === 'loopbig';
        return <circle key={i} cx={x} cy={y} r={big ? 8.5 : 5.4} className={cls(i)} onClick={jump} />;
      })}
      {plan.slots[now] && <circle cx={pts[now].x} cy={pts[now].y} r={plan.slots[now].zone === 'cross' ? 30 : 16} className="bead-ring" />}
    </svg>
  );
}
