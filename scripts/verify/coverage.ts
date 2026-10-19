/**
 * Per-verse coverage audit of the generated data in public/data. Reports, for each of the ~35,800 Vulgate-anchored verses,
 * whether the app has something for it and what kind. Run after `npm run data:build`:  npx tsx scripts/verify/coverage.ts
 *
 * Tiers (a verse is counted in the highest tier it reaches):
 *   verse   — commentary or a Father/saint/curated page whose range is this verse or a short span around it (<= 15 verses, one chapter)
 *   chapter — a page about the chapter or a longer passage: Bible in a Year episode, longer curated spans, and the chapter reading links
 *             (DRBO, New Advent, USCCB) that the study panel builds for every chapter of all 73 books
 *   data    — only machine-linked data (cross-references, topics, places, original-language words)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const D = join(process.cwd(), 'public/data');
const rd = (p: string) => (existsSync(join(D, p)) ? JSON.parse(readFileSync(join(D, p), 'utf8')) : null);
const ed = rd('editions.json').editions.find((e: any) => e.id === 'vulgate');
const counts: Record<string, number[]> = ed.verseCounts;
const key = (c: number, v: number) => c * 1000 + v;

type R = [number, number, number, number];
const spanOf = (r: R) => (r[2] === r[0] ? r[3] - r[1] + 1 : 999);

const biay = rd('media/biay.json');
const biayCh = new Map<string, Set<number>>();
for (const e of biay?.episodes ?? [])
  for (const p of e.passages as string[]) {
    const m = /^(\w+)\.(\d+)/.exec(p);
    if (m) (biayCh.get(m[1]) ?? biayCh.set(m[1], new Set()).get(m[1])!).add(+m[2]);
  }

let total = 0;
const tier = { verse: 0, chapter: 0, data: 0, none: 0 };
const kinds: Record<string, number> = {};
const weak: [string, number, number][] = [];
const out: Record<string, { verses: number; verse: number; chapter: number; data: number; none: number }> = {};

for (const [book, chs] of Object.entries(counts)) {
  const covers = (rs: R[] | null) => {
    const set = new Set<number>();
    for (const r of rs ?? []) for (let c = r[0]; c <= r[2]; c++) {
      const a = c === r[0] ? r[1] : 1;
      const b = c === r[2] ? r[3] : chs[c - 1] ?? 0;
      for (let v = a; v <= b; v++) set.add(key(c, v));
    }
    return set;
  };
  const tuples = (p: string): R[] => (rd(p) ?? []).map((t: number[]) => [t[0], t[1], t[2], t[3]] as R);
  const verseRows: R[] = [];
  const chapterRows: R[] = [];
  const kind = (name: string, rs: R[], short = true) => {
    const keep = short ? rs.filter((r) => spanOf(r) <= 15) : rs;
    const s = covers(keep);
    return s;
  };
  const hay = rd(`commentary/haydock/${book}.json`) ? tuples(`commentary/haydock/${book}.json`) : [];
  const gl = rd(`commentary/glossa/${book}.json`);
  const glR: R[] = gl ? Object.keys(gl).map((k) => { const [c, v] = k.split('.').map(Number); return [c, v, c, v] as R; }) : [];
  const chal = rd(`commentary/challoner/${book}.json`);
  const chalR: R[] = chal ? chal.notes.map((n: number[]) => [n[0], n[1], n[2], n[3]] as R) : [];
  const cat = rd(`commentary/catena/${book}.json`);
  const catR: R[] = cat ? cat.groups.map((g: any) => [g.c, g.v1, g.c, g.v2] as R) : [];
  const fa = tuples(`library/scripture/${book}.json`);
  const res = tuples(`resources/${book}.json`);
  const mag = tuples(`magisterium/${book}.json`);
  const xr = rd(`xrefs/${book}.json`);
  const xrR: R[] = xr ? Object.keys(xr).map((k) => { const [c, v] = k.split('.').map(Number); return [c, v, c, v] as R; }) : [];
  const top = tuples(`topics/by-book/${book}.json`);
  const words = existsSync(join(D, `original/grc/${book}.json`)) || existsSync(join(D, `original/hbo/${book}.json`));

  const sets: Record<string, Set<number>> = {
    haydock: kind('h', hay, false), challoner: kind('x', chalR, false), glossa: kind('g', glR, false), catena: kind('c', catR, false),
    fathers: kind('f', fa), curated: kind('r', res), magisterium: kind('m', mag),
  };
  const chapterSet = covers([...res.filter((r) => spanOf(r) > 15 && r[2] - r[0] < 2)]);
  const biaySet = new Set<number>();
  for (const c of biayCh.get(book) ?? []) for (let v = 1; v <= (chs[c - 1] ?? 0); v++) biaySet.add(key(c, v));
  const dataSets: Record<string, Set<number>> = { xrefs: covers(xrR), topics: kind('t', top), };
  const o = { verses: 0, verse: 0, chapter: 0, data: 0, none: 0 };
  chs.forEach((n, ci) => {
    for (let v = 1; v <= n; v++) {
      const k = key(ci + 1, v);
      o.verses++; total++;
      let t: 'verse' | 'chapter' | 'data' | 'none' = 'none';
      for (const [nm, s] of Object.entries(sets)) if (s.has(k)) { t = 'verse'; kinds[nm] = (kinds[nm] ?? 0) + 1; }
      if (t === 'none') {
        // every chapter has the three reading links in the study panel; BiaY and long curated spans are counted too
        t = 'chapter';
        if (biaySet.has(k)) kinds.biay = (kinds.biay ?? 0) + 1;
        if (chapterSet.has(k)) kinds.curatedChapter = (kinds.curatedChapter ?? 0) + 1;
      }
      for (const [nm, s] of Object.entries(dataSets)) if (s.has(k)) kinds[nm] = (kinds[nm] ?? 0) + 1;
      o[t]++; tier[t]++;
    }
  });
  out[book] = o;
  if (o.verse / o.verses < 0.5) weak.push([book, o.verse, o.verses]);
}

const pct = (n: number) => ((100 * n) / total).toFixed(1) + '%';
const lines = [
  `Verses: ${total}`,
  `Verse-level reading (commentary / Father / saint / short curated span): ${tier.verse} (${pct(tier.verse)})`,
  `Chapter-level only (reading links for every chapter; Bible in a Year; longer spans): ${tier.chapter} (${pct(tier.chapter)})`,
  `Nothing: ${tier.none}`,
  `By source (a verse can appear in several): ${JSON.stringify(kinds)}`,
  `Books where fewer than half the verses have a verse-level reading: ${weak.map(([b, n, t]) => `${b} ${Math.round((100 * n) / t)}%`).join(', ')}`,
];
console.log(lines.join('\n'));
if (process.argv.includes('--write')) writeFileSync(join(process.cwd(), 'data/provenance/coverage.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), total, tier, kinds, books: out }, null, 1));
if (process.argv.includes('--books')) console.log(Object.entries(out).map(([b, o]) => [b, o.chapter, o.verses] as const).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 30).map((x) => `${x[0]} ${x[1]}/${x[2]}`).join('  '));
