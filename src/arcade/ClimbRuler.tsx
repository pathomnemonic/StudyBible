import { LEVELS } from './BasilicaScene';

/** pixels on screen for each metre climbed: 100 m is one 60 px floor line, so 1,000 m is ten screens' worth of lines flying past */
export const PX_PER_M = 0.6;
const ANCHOR = 0.42; // the climber's place on the screen, as a share of its height

/**
 * Faint floor lines (one per 100 m) and landmark labels across the whole screen, behind the question. They scroll with the height, so a climb reads as real
 * distance: a small gain drifts a few lines, a big one sends dozens past, and the named storeys go by with their heights.
 */
export default function ClimbRuler({ metres }: { metres: number }) {
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const anchor = vh * ANCHOR;
  const span = Math.ceil(vh / PX_PER_M / 2) + 200;
  const lo = Math.max(0, Math.floor((metres - span) / 100) * 100), hi = metres + span;
  const marks: { m: number; label: string; major: boolean }[] = [];
  for (let m = lo; m <= hi; m += 100) {
    const lvl = LEVELS.find((l) => l.from >= m && l.from < m + 100);
    if (lvl && lvl.from >= 0) marks.push({ m: lvl.from, label: `${lvl.name} · ${lvl.from.toLocaleString()} m`, major: true });
    else if (m % 500 === 0) marks.push({ m, label: `${m.toLocaleString()} m`, major: false });
  }
  const y = (m: number) => anchor - (m - metres) * PX_PER_M;
  return (
    <div className="dw-ruler" aria-hidden="true" style={{ ['--ry' as string]: `${anchor + metres * PX_PER_M}px` }}>
      {marks.map((k) => <span key={k.m} className={k.major ? 'major' : ''} style={{ top: `${y(k.m)}px` }}>{k.label}</span>)}
      {marks.filter((k) => k.major).map((k) => <b key={k.m} style={{ top: `${y(k.m)}px` }} />)}
      <i className="dw-ruler-you" style={{ top: `${anchor}px` }} />
    </div>
  );
}
