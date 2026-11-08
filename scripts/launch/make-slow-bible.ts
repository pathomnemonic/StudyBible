/** Builds src/data/slowBible.json: the whole Catholic Bible in canonical order, cut into about 2,555 daily readings (seven years) at natural breaks.
 *  A day never crosses from one book into the next; prose is cut at paragraph starts; a short psalm or poem stays whole.
 *  Verse numbers are those of the WEB-Catholic text (modern numbering).  Run: npx tsx scripts/launch/make-slow-bible.ts */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS } from '../../src/lib/canon';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
type Atom = { b: number; c: number; v1: number; v2: number; n: number };
const atoms: Atom[] = [];
BOOKS.forEach((bk, bi) => {
  const d = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bible', 'webc', `${bk.id}.json`), 'utf8'));
  for (const ch of d.chapters) {
    // verse numbers in order, and the verses that begin a prose paragraph
    const vs: number[] = []; const starts = new Set<number>(); let poetry = 0, lines = 0;
    for (const blk of ch.blocks) {
      const kind: string = blk[0]; const items = blk[1];
      if (!Array.isArray(items)) continue;
      const nums = items.filter((x: any) => Array.isArray(x) && x[0] > 0).map((x: any) => x[0] as number);
      if (/^q/.test(kind)) { poetry++; lines++; } else if (kind === 'p') lines++;
      if (nums.length && kind === 'p') starts.add(nums[0]);
      for (const n of nums) if (!vs.includes(n)) vs.push(n);
    }
    if (!vs.length) continue;
    vs.sort((a, b) => a - b);
    const isPoem = lines > 0 && poetry / lines > 0.6;
    const cut: number[] = [vs[0]];
    if (isPoem) { if (vs.length > 30) for (let i = 12; i < vs.length - 5; i += 12) cut.push(vs[i]); }
    else for (const s of starts) if (s > vs[0] && !cut.includes(s)) cut.push(s);
    cut.sort((a, b) => a - b);
    cut.forEach((s, i) => { const e = i + 1 < cut.length ? cut[i + 1] - 1 : vs[vs.length - 1]; const n = vs.filter((v) => v >= s && v <= e).length; if (n) atoms.push({ b: bi, c: ch.n, v1: s, v2: e, n }); });
  }
});
// a long paragraph or list is cut into pieces of about fourteen verses
for (let i = atoms.length - 1; i >= 0; i--) {
  const a = atoms[i]; if (a.n <= 20) continue;
  const pieces = Math.ceil(a.n / 14), per = Math.ceil(a.n / pieces); const out: Atom[] = [];
  for (let v = a.v1, k = 0; k < pieces; k++) { const e = k === pieces - 1 ? a.v2 : Math.min(a.v2, v + per - 1); out.push({ b: a.b, c: a.c, v1: v, v2: e, n: e - v + 1 }); v = e + 1; }
  atoms.splice(i, 1, ...out);
}
const total = atoms.reduce((n, a) => n + a.n, 0);
function cutDays(target: number) {
  const days: Atom[][] = []; let cur: Atom[] = []; let n = 0;
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]; cur.push(a); n += a.n;
    const nextBook = atoms[i + 1] ? atoms[i + 1].b !== a.b : true;
    if (n >= target || nextBook) { days.push(cur); cur = []; n = 0; }
  }
  if (cur.length) days.push(cur);
  return days;
}
// the largest daily size that still fits in seven years
let lo = 5, hi = 60, best = cutDays(hi);
for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; const d = cutDays(mid); if (d.length > 2555) lo = mid; else { hi = mid; best = d; } }
// a day of three verses or fewer at the end of a book joins the day before it
for (let i = best.length - 1; i > 0; i--) {
  const n = best[i].reduce((t, a) => t + a.n, 0), prev = best[i - 1], pn = prev.reduce((t, a) => t + a.n, 0);
  if (n <= 3 && best[i][0].b === prev[0].b && n + pn <= 24) { prev.push(...best[i]); best.splice(i, 1); }
}
const merge = (day: Atom[]) => { const out: number[][] = []; for (const a of day) { const last = out[out.length - 1]; if (last && last[0] === a.b && last[1] === a.c && last[3] + 1 >= a.v1) last[3] = a.v2; else out.push([a.b, a.c, a.v1, a.v2]); } return out; };
const days = best.map(merge);
writeFileSync(join(ROOT, 'src', 'data', 'slowBible.json'), JSON.stringify({ books: BOOKS.map((b) => b.id), days }));
const sizes = best.map((d) => d.reduce((n, a) => n + a.n, 0));
console.log(`${total} verses in ${days.length} days; per day: min ${Math.min(...sizes)}, median ${sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)]}, max ${Math.max(...sizes)}`);
