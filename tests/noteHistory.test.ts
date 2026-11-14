import { describe, expect, it } from 'vitest';
import { MAX_VERSIONS, nextHistory } from '../src/lib/noteHistory';

describe('note history', () => {
  it('keeps the old text when the change is meaningful, newest first', () => {
    const h = nextHistory({ body: 'A long first draft of the note that says one thing.' }, { body: 'A rewritten note that now says something quite different.' }, 1000);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ at: 1000, body: 'A long first draft of the note that says one thing.' });
  });
  it('does not add a version for a tiny edit soon after the last one', () => {
    const old = { body: 'Some text here.', history: [{ at: 900, body: 'Earlier.' }] };
    expect(nextHistory(old, { body: 'Some text here!' }, 1000)).toEqual(old.history);
  });
  it('adds a version for a tiny edit when the last version is old', () => {
    const old = { body: 'Some text here.', history: [{ at: 0, body: 'Earlier.' }] };
    expect(nextHistory(old, { body: 'Some text here!' }, 11 * 60 * 1000)).toHaveLength(2);
  });
  it('never stores empty text or an unchanged text, and is capped', () => {
    expect(nextHistory({ body: '  ' }, { body: 'x'.repeat(50) })).toEqual([]);
    expect(nextHistory(undefined, { body: 'new' })).toEqual([]);
    expect(nextHistory({ body: 'same text that is long enough to count' }, { body: 'same text that is long enough to count' })).toEqual([]);
    let old: any = { body: 'a'.repeat(40) };
    for (let n = 0; n < 12; n++) { const h = nextHistory(old, { body: String(n).repeat(40) }, (n + 1) * 1e7); old = { body: String(n).repeat(40), history: h }; }
    expect(old.history.length).toBe(MAX_VERSIONS);
  });
});
