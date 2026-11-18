import { useId, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/**
 * The picture behind Basilion: a basilica seen from the piazza, tall enough that the camera climbs it as the player scores. Height is in metres: every point
 * is ten metres, so a full set of seven questions (700 points) reaches the cross at 7,000 m. Everything here is drawn as vector art, is bundled with the app
 * and works offline. Nothing in it is needed to play; it is a picture. Under reduced motion the camera still moves but nothing else animates.
 */
export const SUMMIT_M = 7000;
export interface Level { name: string; from: number }
/** the storeys of the building, bottom to top */
export const LEVELS: Level[] = [
  { name: 'The Piazza', from: 0 }, { name: 'The Portico', from: 300 }, { name: 'The First Loggia', from: 700 }, { name: 'The Second Loggia', from: 1200 }, { name: 'The Upper Galleries', from: 1800 },
  { name: 'The Windows of Light', from: 2500 }, { name: 'The Clerestory', from: 3200 }, { name: 'The Attic of Saints', from: 4000 }, { name: 'The Drum', from: 4900 }, { name: 'The Dome', from: 5700 },
  { name: 'The Lantern', from: 6400 }, { name: 'The Cross', from: 7000 },
];
export const levelAt = (m: number) => [...LEVELS].reverse().find((z) => m >= z.from) ?? LEVELS[0];

const W = 400, H = 1600;
/** how many extra storeys are stacked above the first, to make the building tall; each is a copy of the loggia */
const EXTRA_TIERS = 8, TIER_H = 238, EXTRA = EXTRA_TIERS * TIER_H;
const range = (n: number, from = 0) => Array.from({ length: n }, (_, i) => i + from);
const ROSE = ['#b3202f', '#1f4e9c', '#e7a21b', '#1f8a5b', '#7a2a8c', '#d4531e'];

/** a round window of stained glass: petals of colour held by lead */
function Rose({ cx, cy, r, id }: { cx: number; cy: number; r: number; id: string }) {
  const petals = range(12);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill={`url(#${id}-gold)`} />
      <circle cx={cx} cy={cy} r={r} fill="#241b3a" />
      {petals.map((i) => {
        const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2, am = (a0 + a1) / 2;
        const p = (a: number, rr: number) => `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
        return (
          <g key={i}>
            <path d={`M${p(a0, r * 0.2)} L${p(a0, r * 0.97)} A${r * 0.97},${r * 0.97} 0 0 1 ${p(a1, r * 0.97)} L${p(a1, r * 0.2)} Z`} fill={ROSE[i % ROSE.length]} opacity="0.92" />
            <path d={`M${p(am, r * 0.28)} L${p(a0 + 0.07, r * 0.62)} L${p(am, r * 0.88)} L${p(a1 - 0.07, r * 0.62)} Z`} fill="#ffe7a8" opacity="0.5" />
          </g>
        );
      })}
      {petals.map((i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={cx + Math.cos(a) * r * 0.2} y1={cy + Math.sin(a) * r * 0.2} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="#2b2013" strokeWidth="1.3" />; })}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#2b2013" strokeWidth="1.1" />
      <circle cx={cx} cy={cy} r={r * 0.2} fill={`url(#${id}-gold)`} stroke="#2b2013" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r + 1} fill="none" stroke="#fff4c8" strokeOpacity="0.5" strokeWidth="0.8" />
    </g>
  );
}

/** a small figure on the balustrade: a saint, drawn as a robed silhouette with a halo */
function Saint({ x, y, s = 1, id, tall = false }: { x: number; y: number; s?: number; id: string; tall?: boolean }) {
  const h = (tall ? 54 : 40) * s;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy={-h - 6 * s} rx={8 * s} ry={3 * s} fill="none" stroke="#ffd966" strokeWidth={1.1 * s} opacity="0.95" />
      <circle cx="0" cy={-h + 1} r={4.2 * s} fill={`url(#${id}-stoneLit)`} />
      <path d={`M${-8 * s},0 L${-5.5 * s},${-h * 0.72} Q0,${-h * 0.98} ${5.5 * s},${-h * 0.72} L${8 * s},0 Z`} fill={`url(#${id}-stoneLit)`} stroke="#9c845a" strokeWidth="0.6" />
      <path d={`M${-4 * s},${-h * 0.7} L${-9 * s},${-h * 0.45}`} stroke="#b59a68" strokeWidth={2 * s} strokeLinecap="round" />
    </g>
  );
}

export default function BasilicaScene({ height, begun }: { height: number; begun: boolean }) {
  const id = useId().replace(/:/g, '');
  const p = Math.max(0, Math.min(1, height / SUMMIT_M));
  const style = { '--p': p.toFixed(4), '--ar': ((H + EXTRA) / W).toFixed(3) } as CSSProperties;
  const g = (s: string) => `url(#${id}-${s})`;
  const lowerPil = range(9).map((i) => 52 + i * 37);
  const midWin = range(7).map((i) => 74 + i * 42);
  const drumWin = range(7).map((i) => 150 + i * 16);
  const attic = range(13).map((i) => 68 + i * 22.2);
  // drawn straight into <body>: the page that holds the game is moved by its transitions, and a fixed picture inside it would only cover its own column
  const loggia = (
<g>
            <rect x="46" y="1012" width="308" height="238" fill={g('stone')} />
            <rect x="46" y="1012" width="308" height="238" fill={g('shade')} />
            <rect x="42" y="1008" width="316" height="9" fill={g('gold')} />
            {range(8).map((i) => <g key={i}><rect x={52 + i * 40.4} y="1026" width="10" height="212" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.5" /><rect x={50 + i * 40.4} y="1022" width="14" height="6" fill="#e2cfa3" /></g>)}
            {midWin.map((x, i) => i === 3 ? null : (
              <g key={x}>
                <path d={`M${x},1150 v-72 a14,14 0 0 1 28,0 v72 Z`} className="bas-window" fill={g('glow')} stroke="#6d5636" strokeWidth="1.2" />
                <line x1={x + 14} y1="1064" x2={x + 14} y2="1150" stroke="#6d5636" strokeWidth="0.8" /><line x1={x} y1="1106" x2={x + 28} y2="1106" stroke="#6d5636" strokeWidth="0.8" />
                <path d={`M${x - 5},1062 L${x + 14},1040 L${x + 33},1062 Z`} fill="#efe0bd" stroke="#b49a69" strokeWidth="0.8" />
                <rect x={x - 3} y="1150" width="34" height="6" fill="#d4bf92" />
              </g>
            ))}
            <g>
              <path d="M172,1176 v-96 a28,28 0 0 1 56,0 v96 Z" fill="#2a1a0d" stroke={g('gold')} strokeWidth="3" />
              <path d="M178,1176 v-90 a22,22 0 0 1 44,0 v90 Z" className="bas-window" fill={g('glow')} opacity="0.9" />
              <ellipse cx="200" cy="1140" rx="20" ry="30" fill="#fff6c8" opacity="0.4" />
              <rect x="160" y="1168" width="80" height="9" fill={g('gold')} />
              {range(12).map((i) => <rect key={i} x={163 + i * 6.4} y="1174" width="3" height="14" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.4" />)}
              <rect x="160" y="1186" width="80" height="5" fill="#d4bf92" />
              <path d="M168,1052 L200,1022 L232,1052 Z" fill="#f4e7c6" stroke={g('gold')} strokeWidth="2" /><circle cx="200" cy="1044" r="5" fill={g('gold')} />
            </g>
            <rect x="46" y="1244" width="308" height="8" fill="#d4bf92" />
          </g>
  );
  const scene = (
    <div className={`bas-scene${begun ? ' begun' : ''}`} style={style} aria-hidden="true">
      <div className="bas-sky" />
      <div className="bas-sun" />
      <div className="bas-rays" />
      <div className="bas-stars">{range(26).map((i) => <i key={i} style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 62}%`, animationDelay: `${(i % 7) * 0.45}s`, ['--s' as string]: `${2 + (i % 3)}px` }} />)}</div>
      <div className="bas-clouds"><b className="c1" /><b className="c2" /><b className="c3" /><b className="c4" /></div>
      <div className="bas-stage">
        <svg className="bas-svg" viewBox={`0 ${-EXTRA} ${W} ${H + EXTRA}`} preserveAspectRatio="xMidYMax meet" role="presentation" focusable="false">
          <defs>
            <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9d8b4" /><stop offset="0.55" stopColor="#f6ead0" /><stop offset="1" stopColor="#d4bf92" /></linearGradient>
            <linearGradient id={`${id}-stoneLit`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset="1" stopColor="#d9c397" /></linearGradient>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d5636" stopOpacity="0.0" /><stop offset="1" stopColor="#6d5636" stopOpacity="0.28" /></linearGradient>
            <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0a8" /><stop offset="0.45" stopColor="#e6b43c" /><stop offset="1" stopColor="#a8741a" /></linearGradient>
            <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9fc7bd" /><stop offset="0.38" stopColor="#7fb0a6" /><stop offset="1" stopColor="#3e7468" /></linearGradient>
            <radialGradient id={`${id}-domeSheen`} cx="0.35" cy="0.25" r="0.7"><stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
            <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffe9a0" /><stop offset="0.55" stopColor="#ffb948" /><stop offset="1" stopColor="#c8651a" /></radialGradient>
            <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff8d6" stopOpacity="0.95" /><stop offset="0.35" stopColor="#ffd77a" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd77a" stopOpacity="0" /></radialGradient>
            <linearGradient id={`${id}-door`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b3a1d" /><stop offset="1" stopColor="#3b1f0e" /></linearGradient>
            <linearGradient id={`${id}-plaza`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c7b48b" /><stop offset="1" stopColor="#7d6a4a" /></linearGradient>
            <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.16 0" /></filter>
          </defs>

          <g transform={`translate(0 ${-EXTRA})`}>
          {/* far flanks: two small domes and the roof of the nave behind the front */}
          <g opacity="0.96">
            {[72, 328].map((cx) => (
              <g key={cx}>
                <rect x={cx - 40} y="905" width="80" height="40" fill={g('stone')} />
                <path d={`M${cx - 38},905 C${cx - 38},870 ${cx - 14},850 ${cx},848 C${cx + 14},850 ${cx + 38},870 ${cx + 38},905 Z`} fill={g('dome')} />
                <path d={`M${cx - 38},905 C${cx - 38},870 ${cx - 14},850 ${cx},848 C${cx + 14},850 ${cx + 38},870 ${cx + 38},905 Z`} fill={g('domeSheen')} />
                <rect x={cx - 5} y="828" width="10" height="22" fill={g('stone')} /><path d={`M${cx - 6},828 Q${cx},814 ${cx + 6},828 Z`} fill={g('gold')} />
                <line x1={cx} y1="814" x2={cx} y2="800" stroke="#e6b43c" strokeWidth="2" /><line x1={cx - 5} y1="806" x2={cx + 5} y2="806" stroke="#e6b43c" strokeWidth="2" />
              </g>
            ))}
            <rect x="60" y="930" width="280" height="30" fill={g('stone')} />
          </g>

          {/* the dome: lead-green ribs on a gilded ring, set on its drum */}
          <ellipse cx="200" cy="1015" rx="140" ry="9" fill="#b49a69" opacity="0.4" />
          <g>
            <rect x="140" y="700" width="120" height="240" fill={g('stone')} />
            <rect x="140" y="700" width="120" height="240" fill={g('shade')} />
            {range(8).map((i) => <g key={i}><rect x={146 + i * 14.4} y="712" width="5" height="210" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.5" /><rect x={144 + i * 14.4} y="708" width="9" height="5" fill="#e2cfa3" /><rect x={144 + i * 14.4} y="918" width="9" height="5" fill="#e2cfa3" /></g>)}
            {drumWin.map((x) => <g key={x}><path d={`M${x},792 v-46 a5,5 0 0 1 10,0 v46 Z`} className="bas-window" fill={g('glow')} stroke="#6d5636" strokeWidth="0.9" /><line x1={x + 5} y1="740" x2={x + 5} y2="792" stroke="#6d5636" strokeWidth="0.6" /></g>)}
            {drumWin.map((x) => <path key={`l${x}`} d={`M${x},868 v-34 a5,5 0 0 1 10,0 v34 Z`} className="bas-window" fill={g('glow')} stroke="#6d5636" strokeWidth="0.9" />)}
            <rect x="136" y="696" width="128" height="9" fill={g('gold')} /><rect x="136" y="930" width="128" height="9" fill={g('gold')} />
            {range(17).map((i) => <rect key={i} x={138 + i * 7.7} y="924" width="2.6" height="7" fill="#a8741a" />)}
          </g>
          <path d="M135,700 C135,520 172,440 200,434 C228,440 265,520 265,700 Z" fill={g('dome')} />
          <path d="M135,700 C135,520 172,440 200,434 C228,440 265,520 265,700 Z" fill={g('domeSheen')} />
          {range(15).map((i) => { const k = (i - 7) / 7; return <path key={i} d={`M${200 + k * 65},700 C${200 + k * 66},560 ${200 + k * 22},470 200,436`} fill="none" stroke="#f1d68a" strokeWidth="1.4" opacity="0.9" />; })}
          {[640, 590, 540].map((y, j) => range(5 - j).map((i, _, a) => { const n = a.length; const x = 200 + (i - (n - 1) / 2) * (24 - j * 3.5); return <g key={`${y}-${i}`}><path d={`M${x - 4},${y} v-9 a4,4 0 0 1 8,0 v9 Z`} className="bas-window" fill={g('glow')} stroke="#6d5636" strokeWidth="0.6" /><path d={`M${x - 6},${y - 10} L${x},${y - 17} L${x + 6},${y - 10} Z`} fill="#e9dab6" stroke="#9c845a" strokeWidth="0.4" /></g>; }))}
          <rect x="132" y="694" width="136" height="9" rx="1.5" fill={g('gold')} />

          {/* the lantern, the ball and the cross, lit from within */}
          <g>
            <circle cx="200" cy="250" r="95" fill={g('halo')} className="bas-halo" />
            <rect x="178" y="364" width="44" height="72" fill={g('stone')} stroke="#b49a69" strokeWidth="0.6" />
            {range(6).map((i) => <rect key={i} x={181 + i * 7} y="368" width="3" height="62" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.4" />)}
            {range(5).map((i) => <rect key={i} x={185 + i * 7} y="372" width="4" height="52" className="bas-window" fill={g('glow')} />)}
            <rect x="174" y="358" width="52" height="8" fill={g('gold')} />
            <path d="M178,358 C178,334 190,320 200,318 C210,320 222,334 222,358 Z" fill={g('dome')} /><path d="M178,358 C178,334 190,320 200,318 C210,320 222,334 222,358 Z" fill={g('domeSheen')} />
            <path d="M200,318 L200,306" stroke="#e6b43c" strokeWidth="3" />
            <circle cx="200" cy="300" r="9" fill={g('gold')} stroke="#a8741a" strokeWidth="0.8" />
            <g className="bas-cross"><rect x="197.5" y="196" width="5" height="96" rx="1" fill={g('gold')} stroke="#a8741a" strokeWidth="0.7" /><rect x="184" y="222" width="32" height="5" rx="1" fill={g('gold')} stroke="#a8741a" strokeWidth="0.7" /><circle cx="200" cy="224" r="3" fill="#fff5c4" /></g>
          </g>

          {/* the attic with its balustrade and the saints who stand on it, Christ in the centre */}
          <g>
            <rect x="52" y="940" width="296" height="72" fill={g('stone')} /><rect x="52" y="940" width="296" height="72" fill={g('shade')} />
            <rect x="46" y="934" width="308" height="9" fill={g('gold')} opacity="0.95" />
            {range(34).map((i) => <g key={i}><rect x={58 + i * 8.7} y="946" width="4.2" height="20" rx="1.6" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.4" /></g>)}
            {attic.map((x, i) => <Saint key={x} x={x} y={934} id={id} s={i === 6 ? 1.25 : 0.95} tall={i === 6} />)}
            {range(8).map((i) => <rect key={i} x={72 + i * 36} y="972" width="20" height="30" fill="#4a3a28" opacity="0.22" rx="2" />)}
            <rect x="52" y="1006" width="296" height="6" fill="#d4bf92" />
          </g>

          </g>
          {loggia}
          {range(EXTRA_TIERS).map((j) => <g key={j} transform={`translate(0 ${-(j + 1) * TIER_H})`}>{loggia}</g>)}

          {/* the Portico: nine columns, three doors and the great rose window */}
          <g>
            <rect x="34" y="1250" width="332" height="250" fill={g('stone')} />
            <rect x="34" y="1250" width="332" height="250" fill={g('shade')} />
            <rect x="28" y="1244" width="344" height="12" fill={g('gold')} />
            <Rose cx={200} cy={1306} r={34} id={id} />
            {lowerPil.map((x) => <g key={x}><rect x={x} y="1272" width="14" height="206" fill="#fff4da" stroke="#c4aa78" strokeWidth="0.5" /><rect x={x - 2} y="1268" width="18" height="8" fill="#e2cfa3" /><rect x={x - 2} y="1474" width="18" height="9" fill="#d4bf92" />{range(4).map((k) => <line key={k} x1={x + 3.5 + k * 2.6} y1="1280" x2={x + 3.5 + k * 2.6} y2="1470" stroke="#d7c293" strokeWidth="0.5" />)}</g>)}
            {[[104, 22, 58], [274, 22, 58]].map(([x, w, h]) => <g key={x}><path d={`M${x},1470 v-${h} a${w / 2},${w / 2} 0 0 1 ${w},0 v${h} Z`} fill={g('door')} stroke="#a8741a" strokeWidth="1.6" /><path d={`M${x + 4},1470 v-${h - 4} a${w / 2 - 4},${w / 2 - 4} 0 0 1 ${w - 8},0 v${h - 4} Z`} fill="none" stroke="#e6b43c" strokeWidth="0.7" /></g>)}
            <g>
              <path d="M170,1478 v-110 a30,30 0 0 1 60,0 v110 Z" fill="#fff0b8" opacity="0.5" />
              <path d="M174,1478 v-104 a26,26 0 0 1 52,0 v104 Z" fill={g('door')} stroke="#a8741a" strokeWidth="2.4" />
              <line x1="200" y1="1348" x2="200" y2="1478" stroke="#e6b43c" strokeWidth="1.4" />
              {range(3).map((k) => range(2).map((c) => <rect key={`${k}${c}`} x={179 + c * 23} y={1384 + k * 31} width="18" height="24" rx="2" fill="none" stroke="#c98e2c" strokeWidth="0.9" />))}
              <circle cx="195" cy="1430" r="2.2" fill="#ffe27a" /><circle cx="205" cy="1430" r="2.2" fill="#ffe27a" />
            </g>
            <rect x="34" y="1494" width="332" height="10" fill="#bfa97a" />
          </g>

          {/* the steps and the piazza */}
          {range(5).map((i) => <g key={i}><rect x={26 - i * 6} y={1500 + i * 12} width={348 + i * 12} height="12" fill={i % 2 ? '#d9c8a2' : '#e8d9b6'} /><rect x={26 - i * 6} y={1509 + i * 12} width={348 + i * 12} height="3" fill="#8f7a52" opacity="0.5" /></g>)}
          <rect x="-12" y="1560" width="424" height="40" fill={g('plaza')} />
          {range(12).map((i) => <line key={i} x1={i * 36 - 6} y1="1562" x2={i * 36 - 30 + (i - 6) * 8} y2="1600" stroke="#6d5a3a" strokeWidth="0.6" opacity="0.5" />)}
          <ellipse cx="200" cy="1520" rx="150" ry="10" fill="#fff0b8" opacity="0.22" />
          {/* grain over the stone, so the walls are not flat */}
          <rect x="26" y="940" width="348" height="570" filter={`url(#${id}-grain)`} opacity="0.9" />
          <rect x="135" y="696" width="130" height="244" filter={`url(#${id}-grain)`} opacity="0.9" />
        </svg>
      </div>
      <div className="bas-dust">{range(16).map((i) => <i key={i} style={{ left: `${(i * 61 + 9) % 100}%`, animationDelay: `${(i % 8) * 0.9}s`, animationDuration: `${9 + (i % 5) * 2.2}s` }} />)}</div>
      <div className="bas-vignette" />
    </div>
  );
  return typeof document === 'undefined' ? scene : createPortal(scene, document.body);
}

/** a small elevation of the same building for the side of the page: the part you have climbed is gilded and a dove marks where you are */
/** where the gilding ends, as a percentage up the gauge */
export const miniPct = (height: number) => ((8 + Math.max(0, Math.min(1, height / SUMMIT_M)) * 372) / 400) * 100;
export function MiniBasilica({ height }: { height: number }) {
  const id = useId().replace(/:/g, '');
  const p = Math.max(0, Math.min(1, height / SUMMIT_M));
  const top = 400 - 8 - p * 372; // the gilded part rises from the steps to the cross
  const shapes = [
    <rect key="a" x="2" y="390" width="96" height="10" />, <rect key="b" x="6" y="384" width="88" height="7" />,
    <rect key="c" x="10" y="326" width="80" height="58" />, <rect key="d" x="14" y="268" width="72" height="58" />, <rect key="e" x="16" y="244" width="68" height="24" />,
    <rect key="f" x="35" y="168" width="30" height="76" />,
    <path key="g" d="M33,168 C33,134 44,116 50,114 C56,116 67,134 67,168 Z" />,
    <rect key="h" x="45" y="92" width="10" height="24" />, <path key="i" d="M44,92 C44,82 48,78 50,77 C52,78 56,82 56,92 Z" />,
    <rect key="j" x="48.5" y="38" width="3.4" height="40" />, <rect key="k" x="42" y="50" width="16.4" height="3.4" />,
    <ellipse key="l" cx="9" cy="238" rx="8" ry="11" />, <ellipse key="m" cx="91" cy="238" rx="8" ry="11" />,
  ];
  return (
    <svg className="bas-mini" viewBox="0 0 100 400" preserveAspectRatio="none" role="presentation" focusable="false" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>{shapes}</clipPath>
        <linearGradient id={`${id}-lit`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#8a5e10" /><stop offset="0.5" stopColor="#e6b43c" /><stop offset="1" stopColor="#fff1a8" /></linearGradient>
      </defs>
      <g fill="rgba(26,18,48,0.78)" stroke="rgba(241,207,107,0.85)" strokeWidth="1.2">{shapes}</g>
      <g clipPath={`url(#${id}-clip)`}>
        <rect className="bas-mini-lit" x="0" y={top} width="100" height={400 - top} fill={`url(#${id}-lit)`} />
        <rect x="0" y={top} width="100" height="2" fill="#fff8d6" />
      </g>
      <circle className="bas-mini-dove" cx="50" cy={top} r="9" fill="#fff6c8" opacity="0.9" />
    </svg>
  );
}
