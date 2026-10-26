import { describe, expect, it } from 'vitest';
import { splitScripture } from '../src/lib/scriptureLinks';

describe('splitScripture', () => {
  it('finds references and keeps the rest as text', () => {
    const p = splitScripture('As John 6:51 says, and see 1 Cor. 11:23-26; also Ps. 23 and Matt. 16:18.');
    const refs = p.filter((x) => typeof x !== 'string').map((x) => (x as { text: string }).text);
    expect(refs).toEqual(['John 6:51', '1 Cor. 11:23-26', 'Ps. 23', 'Matt. 16:18']);
    expect(p.map((x) => (typeof x === 'string' ? x : x.text)).join('')).toBe('As John 6:51 says, and see 1 Cor. 11:23-26; also Ps. 23 and Matt. 16:18.');
  });
  it('ignores things that are not scripture', () => {
    expect(splitScripture('In Book 3 of Rome 12 times, at 10:30').every((x) => typeof x === 'string')).toBe(true);
  });
});
