// Production dependency audit as a gate: high and critical findings FAIL the build unless there is a tracked, unexpired waiver.
// Each package is reported as PASS (below the line), WAIVED (waiver with owner, reason and expiry) or FAIL.
// Waivers live in docs/AUDIT_EXCEPTIONS.json; an expired waiver fails again, so nothing is waived for ever by accident.
// Usage: node scripts/audit-gate.mjs [--json-file path]   (the file is `npm audit --omit=dev --json` output, for tests)
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const arg = process.argv.indexOf('--json-file');
const raw = arg > 0 ? readFileSync(process.argv[arg + 1], 'utf8') : spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout;
let report; try { report = JSON.parse(raw); } catch { console.error('FAIL: could not read the npm audit output'); process.exit(2); }
if (report.error) { console.error('FAIL: npm audit could not run:', report.error.summary ?? report.error); process.exit(2); }
const waivers = JSON.parse(readFileSync(new URL('../docs/AUDIT_EXCEPTIONS.json', import.meta.url), 'utf8')).waivers ?? [];
const today = process.env.AUDIT_TODAY ?? new Date().toISOString().slice(0, 10);
const LINE = new Set(['high', 'critical']);
let failed = 0, waived = 0, passed = 0;
for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
  if (!LINE.has(v.severity)) { passed++; console.log(`PASS    ${name} (${v.severity}: below the gate)`); continue; }
  const w = waivers.find((x) => x.package === name);
  const why = (v.via ?? []).filter((x) => typeof x === 'object').map((x) => x.title).slice(0, 2).join('; ') || 'via a dependency';
  if (w && w.owner && w.reason && w.expires && w.expires >= today) { waived++; console.log(`WAIVED  ${name} (${v.severity}) until ${w.expires}, owner ${w.owner}: ${w.reason}`); continue; }
  failed++;
  console.log(`FAIL    ${name} (${v.severity}): ${why}${w ? ` [waiver expired ${w.expires}]` : ''}`);
}
console.log(`\naudit gate: ${failed} failed, ${waived} waived, ${passed} below the gate`);
process.exit(failed ? 1 : 0);
