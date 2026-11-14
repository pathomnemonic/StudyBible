// The dependency audit gate (audit Part II-8): high findings fail unless waived with an owner, a reason and an unexpired date.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'gate-'));
const run = (vulns: Record<string, any>, today?: string) => {
  const f = join(dir, `r${Math.random()}.json`);
  writeFileSync(f, JSON.stringify({ vulnerabilities: vulns }));
  const r = spawnSync('node', ['scripts/audit-gate.mjs', '--json-file', f], { encoding: 'utf8', env: { ...process.env, ...(today ? { AUDIT_TODAY: today } : {}) } });
  return { code: r.status, out: r.stdout };
};
const hi = (name: string, sev = 'high') => ({ [name]: { severity: sev, via: [{ title: 'a flaw' }] } });

describe('audit gate', () => {
  it('fails on a high finding with no waiver', () => {
    const r = run(hi('left-pad'));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/FAIL\s+left-pad/);
  });
  it('fails on a critical finding with no waiver', () => {
    expect(run(hi('left-pad', 'critical')).code).toBe(1);
  });
  it('passes findings below the line', () => {
    const r = run({ ...hi('a', 'moderate'), ...hi('b', 'low') });
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/PASS\s+a/);
  });
  it('reports a waived finding as WAIVED, not as passing, and names the owner and date', () => {
    const r = run(hi('pptxgenjs'), '2026-12-01');
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/WAIVED\s+pptxgenjs.*until 2027-02-14.*owner pathomnemonic/);
  });
  it('an expired waiver fails again', () => {
    const r = run(hi('pptxgenjs'), '2027-03-01');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/waiver expired 2027-02-14/);
  });
  it('a mix: one waived, one not, still fails', () => {
    expect(run({ ...hi('pptxgenjs'), ...hi('left-pad') }, '2026-12-01').code).toBe(1);
  });
  it('an unreadable audit is a failure, not a pass', () => {
    const f = join(dir, 'bad.json'); writeFileSync(f, 'not json');
    expect(spawnSync('node', ['scripts/audit-gate.mjs', '--json-file', f], { encoding: 'utf8' }).status).toBe(2);
  });
});
