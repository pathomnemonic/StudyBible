// Production dependency audit as a gate: high and critical findings FAIL the build unless there is a tracked, unexpired waiver.
// Each package is reported as PASS (below the line), WAIVED (waiver with owner, reason and expiry) or FAIL.
// Waivers live in docs/AUDIT_EXCEPTIONS.json; an expired waiver fails again, so nothing is waived for ever by accident.
// A waiver covers only the advisories it names (its "advisories" list of GHSA ids): a new advisory in a
// waived package is not covered and fails. A finding whose via names only other packages (strings) carries
// no advisory of its own; the advisories live on those packages' own entries, so the package waiver covers it.
// Usage: node scripts/audit-gate.mjs [--json-file path]   (the file is `npm audit --omit=dev --json` output, for tests)
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const arg = process.argv.indexOf('--json-file');
let raw;
if (arg > 0) raw = readFileSync(process.argv[arg + 1], 'utf8');
else {
  const res = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error || !res.stdout) { console.error('FAIL: npm audit could not run:', res.error ? res.error.message : 'no output'); process.exit(2); }
  raw = res.stdout;
}
let report; try { report = JSON.parse(raw); } catch { console.error('FAIL: could not read the npm audit output'); process.exit(2); }
if (!report || report.error) { console.error('FAIL: npm audit could not run:', report?.error?.summary ?? report?.error ?? 'empty report'); process.exit(2); }
const waivers = JSON.parse(readFileSync(new URL('../docs/AUDIT_EXCEPTIONS.json', import.meta.url), 'utf8')).waivers ?? [];
const today = process.env.AUDIT_TODAY ?? new Date().toISOString().slice(0, 10);
const LINE = new Set(['high', 'critical']);
// the advisory ids a finding carries: GHSA ids out of the via entries' urls (a title stands in when a
// fixture or an old npm names no url); string via entries name other packages and carry no advisory
const advisoryIds = (v) => (v.via ?? []).filter((x) => typeof x === 'object').map((x) => {
  const m = /GHSA-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/i.exec(x.url ?? '');
  return m ? m[0] : (x.title ?? 'unknown advisory');
});
let failed = 0, waived = 0, passed = 0;
for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
  if (!LINE.has(v.severity)) { passed++; console.log(`PASS    ${name} (${v.severity}: below the gate)`); continue; }
  const ids = advisoryIds(v);
  const covers = (x) => ids.every((id) => (x.advisories ?? []).map((a) => a.toLowerCase()).includes(id.toLowerCase()));
  const w = waivers.find((x) => x.package === name && x.owner && x.reason && x.expires && x.expires >= today && covers(x));
  const why = (v.via ?? []).filter((x) => typeof x === 'object').map((x) => x.title).slice(0, 2).join('; ') || 'via a dependency';
  if (w) { waived++; console.log(`WAIVED  ${name} (${v.severity}) until ${w.expires}, owner ${w.owner}: ${w.reason}`); continue; }
  const anyW = waivers.find((x) => x.package === name);
  const note = anyW ? (anyW.expires && anyW.expires < today ? ` [waiver expired ${anyW.expires}]` : ` [waiver does not name ${ids.join(', ') || 'this finding'}]`) : '';
  failed++;
  console.log(`FAIL    ${name} (${v.severity}): ${why}${note}`);
}
console.log(`\naudit gate: ${failed} failed, ${waived} waived, ${passed} below the gate`);
process.exit(failed ? 1 : 0);
