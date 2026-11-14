import { describe, expect, it } from 'vitest';
import { formatCopy } from '../src/lib/copyFormat';

const v = [{ n: 51, text: 'I am the living bread.' }, { n: 52, text: 'The Jews quarrelled.' }];
describe('copy formats', () => {
  it('keeps the translation text unchanged in every style', () => {
    for (const s of ['numbers', 'plain', 'quote', 'markdown'] as const) {
      const out = formatCopy(s, v, 'John 6:51–52', 'WEB-C');
      expect(out).toContain('I am the living bread.');
      expect(out).toContain('John 6:51–52 (WEB-C)');
    }
  });
  it('numbers, plain, quote', () => {
    expect(formatCopy('numbers', v, 'J', 'T')).toBe('51 I am the living bread. 52 The Jews quarrelled.\n— J (T)');
    expect(formatCopy('plain', v, 'J', 'T')).toBe('I am the living bread. The Jews quarrelled.\n— J (T)');
    expect(formatCopy('quote', v, 'J', 'T')).toBe('“I am the living bread. The Jews quarrelled.” — J (T)');
  });
  it('markdown block quote and reference only', () => {
    expect(formatCopy('markdown', v, 'J', 'T')).toBe('> I am the living bread.\n>\n> The Jews quarrelled.\n\n**J (T)**');
    expect(formatCopy('reference', v, 'J', 'T')).toBe('J (T)');
  });
});
