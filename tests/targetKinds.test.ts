import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
vi.stubGlobal('location', { origin: 'https://example.org' });

/** every `type: '…'` of the Target union as written in src/db/db.ts */
function targetTypesInDb(): string[] {
  const src = readFileSync('src/db/db.ts', 'utf8');
  // the union runs from its declaration to the `};` that closes its last member: taking everything up
  // to the first `;` at a line end would cut it short the day a member is wrapped across lines, and
  // [a-z]+ would silently drop a camelCase kind, so take the whole declaration and every letter case
  const start = src.indexOf('export type Target =');
  const block = src.slice(start, src.indexOf('};', start));
  return [...new Set([...block.matchAll(/type:\s*'([A-Za-z]+)'/g)].map((m) => m[1]))];
}

describe('one table of every kind of target', () => {
  it('has a label, a link and a missing check for every Target type in db.ts', async () => {
    const { TARGET_KINDS } = await import('../src/lib/collections');
    const types = targetTypesInDb();
    expect(types.length).toBeGreaterThanOrEqual(11);
    for (const t of types) {
      const e = (TARGET_KINDS as Record<string, any>)[t];
      expect(e, `no entry for target type ${t}`).toBeTruthy();
      expect(e.label.length).toBeGreaterThan(0);
      expect(typeof e.link).toBe('function');
      expect(typeof e.missing).toBe('function');
    }
    expect(Object.keys(TARGET_KINDS).sort()).toEqual([...types].sort());
  });

  it('links and flags broken targets', async () => {
    const { targetLink, targetMissing, targetKind } = await import('../src/lib/collections');
    const have = { note: new Set(['n1']), highlight: new Set<string>(), bookmark: new Set<string>() };
    expect(targetLink({ type: 'catechism', para: 1324 })).toEqual({ to: '/study/catechism/1324' });
    expect(targetLink({ type: 'link', url: 'https://a.org', label: 'A' })).toEqual({ url: 'https://a.org' });
    expect(targetKind({ type: 'work', workId: 'w', label: 'W' })).toBe('Church writing');
    expect(targetMissing({ type: 'passage', ref: 'nonsense' })).toBe(true);
    expect(targetMissing({ type: 'passage', ref: 'JHN.6.51-58' })).toBe(false);
    expect(targetMissing({ type: 'catechism', para: 9999 })).toBe(true);
    expect(targetMissing({ type: 'note', uid: 'n1' }, have)).toBe(false);
    expect(targetMissing({ type: 'note', uid: 'gone' }, have)).toBe(true);
    expect(targetMissing({ type: 'note', uid: 'gone' })).toBe(false);
    expect(targetMissing({ type: 'link', url: 'javascript:alert(1)', label: 'x' })).toBe(true);
    // and the link itself is never handed out for a script or data URL: the target resolves to nothing
    expect(targetLink({ type: 'link', url: 'javascript:alert(1)', label: 'x' })).toEqual({});
    expect(targetLink({ type: 'link', url: 'data:text/html,<b>x</b>', label: 'x' })).toEqual({});
  });
});
