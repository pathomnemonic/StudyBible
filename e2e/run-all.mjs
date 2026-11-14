// Runs every browser check the release depends on, one after another, and fails if any fails. Used by CI.
// Needs the built app served on http://localhost:4173 (npx vite preview --port 4173). offline.mjs and offlinepack.mjs start their own server on 4199.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { parseShard } from './lib/config.mjs';
const CHECKS = [
  'smoke', 'newroutes', 'notfound', 'versenote', 'xref', 'dataflow', 'parallel', 'crosslinks', 'passportgo', 'bigquestions',
  'collections', 'review', 'studytools', 'videoshorts', 'videoresume', 'offline', 'offlinepack', 'stalechunk', 'recovery', 'updatesafety', 'themeapplier', 'reader-companion', 'editionswitch', 'readerbar', 'a11y2', 'a11y3', 'a11y', 'mediahost', 'mediahost-lifecycle', 'mediaaudit', 'overlap', 'behaviors', 'invariants-selftest', 'crawler-selftest', 'sweep',
];
// SHARD=2/3 runs the second of three slices, so CI can run the checks in parallel jobs
let si, sn;
try { [si, sn] = parseShard(process.env.SHARD ?? '1/1'); } catch (e) { console.error(`FAIL runner configuration: ${e.message}`); process.exit(2); }
const missing = CHECKS.filter((c) => !existsSync(`e2e/${c}.mjs`));
if (missing.length) { console.error(`FAIL runner configuration: no such check file: ${missing.join(', ')}`); process.exit(2); }
const mine = CHECKS.filter((_, i) => i % sn === si - 1);
if (!mine.length) { console.error(`FAIL runner configuration: shard ${si}/${sn} selects no checks (there are ${CHECKS.length})`); process.exit(2); }
console.log(`runner configuration: shard ${si}/${sn} runs ${mine.length} of ${CHECKS.length} checks: ${mine.join(', ')}`);
const failed = [];
for (const c of mine) {
  const t = Date.now();
  const r = spawnSync('node', [`e2e/${c}.mjs`], { stdio: 'inherit', env: c === 'sweep' ? { ...process.env, SWEEP_MODE: process.env.SWEEP_MODE ?? 'fast' } : process.env });
  const ok = r.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c} (${Math.round((Date.now() - t) / 1000)}s)`);
  if (!ok) failed.push(c);
}
if (failed.length) { console.error('\nFailed: ' + failed.join(', ')); process.exit(1); }
console.log(`\nAll ${mine.length} browser checks in this shard passed.`);
