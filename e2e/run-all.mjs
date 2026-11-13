// Runs every browser check the release depends on, one after another, and fails if any fails. Used by CI.
// Needs the built app served on http://localhost:4173 (npx vite preview --port 4173). offline.mjs and offlinepack.mjs start their own server on 4199.
import { spawnSync } from 'node:child_process';
const CHECKS = [
  'smoke', 'newroutes', 'notfound', 'versenote', 'xref', 'dataflow', 'parallel', 'crosslinks', 'passportgo', 'bigquestions',
  'collections', 'studytools', 'videoshorts', 'videoresume', 'offline', 'offlinepack', 'stalechunk', 'readerbar', 'a11y2', 'a11y3', 'a11y',
];
const failed = [];
for (const c of CHECKS) {
  const t = Date.now();
  const r = spawnSync('node', [`e2e/${c}.mjs`], { stdio: 'inherit', env: process.env });
  const ok = r.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c} (${Math.round((Date.now() - t) / 1000)}s)`);
  if (!ok) failed.push(c);
}
if (failed.length) { console.error('\nFailed: ' + failed.join(', ')); process.exit(1); }
console.log(`\nAll ${CHECKS.length} browser checks passed.`);
