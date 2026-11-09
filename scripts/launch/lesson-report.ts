// What the catechism lessons have and lack, by age band: node via `npx tsx scripts/launch/lesson-report.ts`
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { contentPoints, guidanceNotes } from '../../src/curriculum/teachpoints';
const dir = join(process.cwd(), 'public/data/curriculum');
const words = (t: string) => t.split(/\s+/).filter(Boolean);
const fk = (t: string) => { const w = words(t); if (!w.length) return 0; const sn = (t.match(/[^.!?]+[.!?]+/g) ?? [t]).length; const syl = w.reduce((n, x) => n + Math.max(1, (x.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) ?? []).length), 0); return 0.39 * (w.length / sn) + 11.8 * (syl / w.length) - 15.59; };
const by: Record<string, { n: number; explain: number; objectives: number; remember: number; materials: number; visual: number; ccc: number; guide: number; idea: number[]; points: number[] }> = {};
for (const f of readdirSync(dir).filter((x) => /^grade-.*\.json$/.test(x))) {
  const g = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const b = (by[g.band] ??= { n: 0, explain: 0, objectives: 0, remember: 0, materials: 0, visual: 0, ccc: 0, guide: 0, idea: [], points: [] });
  for (const u of g.units) for (const l of u.lessons) {
    b.n++; if (l.explain) b.explain++; if (l.objectives) b.objectives++; if (l.remember) b.remember++; if (l.materials) b.materials++; if (l.visual) b.visual++;
    b.guide += guidanceNotes(l).length;
    b.ccc += contentPoints(l).filter((p) => /CCC \d/.test(p)).length;
    b.idea.push(fk(l.idea)); b.points.push(fk(contentPoints(l).join(' ')));
  }
}
const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(1);
console.log('band        lessons explain objectives remember materials visual | learner points citing "CCC n" | FK idea / points');
for (const [band, b] of Object.entries(by)) console.log(`${band.padEnd(11)} ${String(b.n).padStart(5)} ${String(b.explain).padStart(7)} ${String(b.objectives).padStart(10)} ${String(b.remember).padStart(8)} ${String(b.materials).padStart(9)} ${String(b.visual).padStart(6)} | ${String(b.ccc).padStart(4)} | ${avg(b.idea)} / ${avg(b.points)}`);
