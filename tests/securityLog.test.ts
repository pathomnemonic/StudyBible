import { describe, expect, it } from 'vitest';
import { describeEvent, needsCode, recoveryFile } from '../src/lib/securityLog';

describe('account security wording', () => {
  it('describes known events and passes unknown ones through', () => {
    expect(describeEvent('2fa-enabled')).toBe('Two-factor sign-in turned on');
    expect(describeEvent('something-new')).toBe('something-new');
  });
  it('recognises the server asking for a second code', () => {
    expect(needsCode('Enter the six-digit code from your authenticator app (or a recovery code).')).toBe(true);
    expect(needsCode('Email or password is incorrect.')).toBe(false);
  });
  it('writes a recovery file with every code', () => {
    const f = recoveryFile('a@b.org', ['aaaa-bbbb-cccc', 'dddd-eeee-ffff']);
    expect(f).toContain('a@b.org');
    expect(f).toContain('aaaa-bbbb-cccc\ndddd-eeee-ffff');
  });
});
