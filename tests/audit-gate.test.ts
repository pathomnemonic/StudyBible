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
    // pptxgenjs carries no advisory of its own: its finding names image-size, whose own entry is gated below
    const r = run({ pptxgenjs: { severity: 'high', via: ['image-size'] } }, '2026-12-01');
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/WAIVED\s+pptxgenjs.*until 2027-02-14.*owner pathomnemonic/);
  });
  it('waives a package only for the advisories its waiver names', () => {
    const named = { 'image-size': { severity: 'high', via: [
      { title: 'image-size has an unhandled exception in the ICNS parser', url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr' },
      { title: 'image-size has an unhandled exception in the JXL parser', url: 'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq' },
    ] } };
    const r = run(named, '2026-12-01');
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/WAIVED\s+image-size/);
  });
  it('a new advisory in a waived package fails: the waiver does not name it', () => {
    const fresh = { 'image-size': { severity: 'critical', via: [{ title: 'a new flaw', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc' }] } };
    const r = run(fresh, '2026-12-01');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/FAIL\s+image-size.*waiver does not name GHSA-aaaa-bbbb-cccc/);
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
