import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('the iOS build setup', () => {
  const yaml = readFileSync('codemagic.yaml', 'utf8');
  it('passes its own consistency check (bundle id, icon, plist)', () => {
    expect(execFileSync('npx', ['tsx', 'scripts/ios/check.ts'], { encoding: 'utf8' })).toMatch(/iOS check passed \(bundle id org\.cathology\.app\)/);
  });
  it('has an ios-release workflow that never starts by itself and never sends a build to App Review', () => {
    expect(yaml).toMatch(/^ {2}ios-release:/m);
    expect(yaml).not.toMatch(/^\s*triggering:/m);
    expect(yaml).toMatch(/submit_to_app_store:\s*false/);
    expect(yaml).toMatch(/submit_to_testflight:\s*true/);
    expect(yaml).toMatch(/distribution_type:\s*app_store/);
  });
  it('builds the store app with no sync server and without telemetry hooks for native', () => {
    expect(yaml).toMatch(/VITE_LOCAL_ONLY:\s*"1"/);
    expect(yaml).not.toMatch(/VITE_ACCOUNTS/);
  });
});
