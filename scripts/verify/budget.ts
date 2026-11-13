import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Size budgets for the production build (gzip bytes). Run after `npm run build`:  npx tsx scripts/verify/budget.ts
 * Fails when the first-load script or stylesheet grows past its budget, when any single script grows past the
 * per-chunk limit, or when the generated data folder passes its ceiling. Raise a budget on purpose, in this file, with a reason.
 */
const KB = 1024;
// Raised on 2026-11-13 to the measured size plus about 8% headroom. The limits were set when the app was a fraction of its size and had
// been failing since; the failure was hidden because the step before it (generated documents) failed first. The app now has about 180
// routes, 14 themes, print and accessibility styles, and a 270 MB data folder (Fathers library, 13 packs, 42,000-video index, 456 lessons).
// The real fix for the script is to split shared code out of the entry chunk (see docs/CYCLE2_REPORT.md); until then these stop it growing further.
const BUDGET = {
  entryJs: 380 * KB, // the app shell: assets/index-*.js (351 KB measured)
  entryCss: 70 * KB, // (64 KB measured)
  anyJs: 260 * KB, // lazy chunks (3D scene, maps, pages)
  dataDir: 290 * 1024 * KB, // dist/data on disk, uncompressed (269 MB measured)
};

const dist = join(process.cwd(), 'dist');
const gz = (f: string) => gzipSync(readFileSync(f), { level: 9 }).length;
const assets = join(dist, 'assets');
const problems: string[] = [];
const rows: string[] = [];
for (const f of readdirSync(assets)) {
  const p = join(assets, f);
  if (/^index-.*\.js$/.test(f)) { const n = gz(p); rows.push(`entry js ${(n / KB).toFixed(0)} KB (budget ${BUDGET.entryJs / KB})`); if (n > BUDGET.entryJs) problems.push(`entry script ${f} is ${(n / KB).toFixed(0)} KB gzip, over ${BUDGET.entryJs / KB}`); }
  else if (/^index-.*\.css$/.test(f)) { const n = gz(p); rows.push(`entry css ${(n / KB).toFixed(0)} KB (budget ${BUDGET.entryCss / KB})`); if (n > BUDGET.entryCss) problems.push(`stylesheet ${f} is ${(n / KB).toFixed(0)} KB gzip, over ${BUDGET.entryCss / KB}`); }
  else if (f.endsWith('.js')) { const n = gz(p); if (n > BUDGET.anyJs) problems.push(`chunk ${f} is ${(n / KB).toFixed(0)} KB gzip, over ${BUDGET.anyJs / KB}`); }
}
const size = (d: string): number => readdirSync(d).reduce((n, f) => { const p = join(d, f); return n + (statSync(p).isDirectory() ? size(p) : statSync(p).size); }, 0);
const data = size(join(dist, 'data'));
rows.push(`data ${(data / 1048576).toFixed(0)} MB (ceiling ${BUDGET.dataDir / 1048576})`);
if (data > BUDGET.dataDir) problems.push(`dist/data is ${(data / 1048576).toFixed(0)} MB, over ${BUDGET.dataDir / 1048576}`);
console.log(rows.join('\n'));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('budgets ok');
