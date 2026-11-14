import { describe, expect, it } from 'vitest';
import { judgeSavedFile } from '../src/data/loader';

describe('judging a saved file', () => {
  it('accepts readable JSON and non-empty text', () => {
    expect(judgeSavedFile('a/b.json', '{"x":1}')).toBe(true);
    expect(judgeSavedFile('a/b.txt', 'hello')).toBe(true);
  });
  it('rejects empty, cut-off or damaged files', () => {
    expect(judgeSavedFile('a/b.json', '')).toBe(false);
    expect(judgeSavedFile('a/b.json', '{"x":')).toBe(false);
    expect(judgeSavedFile('a/b.json', '<html>offline</html>')).toBe(false);
    expect(judgeSavedFile('a/b.txt', '   ')).toBe(false);
  });
});
