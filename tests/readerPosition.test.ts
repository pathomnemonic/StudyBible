import { describe, expect, it } from 'vitest';
import { addPair, aboutShouldAutoOpen, hasPair, recentPassages, removePair, scrolledIntoChapter, topVisibleVerse } from '../src/lib/readerPosition';

describe('topVisibleVerse', () => {
  const rects = [1, 2, 3, 4].map((n) => ({ n, top: (n - 3) * 100, bottom: (n - 3) * 100 + 90 }));
  it('is the first verse whose bottom is below the reader bar', () => {
    expect(topVisibleVerse(rects, 64)).toBe(3); // verse 2 ends at -10, verse 3 is at 0..90
  });
  it('is null with nothing measured, and ignores order', () => {
    expect(topVisibleVerse([], 64)).toBeNull();
    expect(topVisibleVerse([...rects].reverse(), 64)).toBe(3);
  });
  it('carries a verse only once the reader has scrolled into the chapter', () => {
    expect(scrolledIntoChapter(0)).toBe(false);
    expect(scrolledIntoChapter(600)).toBe(true);
  });
});

describe('About this chapter setting', () => {
  const base = { pref: 'auto' as const, lastOpen: true, hasContent: true, touched: false, scrollY: 0 };
  it("keeps today's default: opens by itself when there is content", () => {
    expect(aboutShouldAutoOpen(base)).toBe(true);
    expect(aboutShouldAutoOpen({ ...base, hasContent: false })).toBe(false);
  });
  it('closed never opens by itself; remember follows the last choice', () => {
    expect(aboutShouldAutoOpen({ ...base, pref: 'closed' })).toBe(false);
    expect(aboutShouldAutoOpen({ ...base, pref: 'remember', lastOpen: false })).toBe(false);
    expect(aboutShouldAutoOpen({ ...base, pref: 'remember', lastOpen: true })).toBe(true);
  });
  it('does not push the text down once the reader is mid-chapter or has chosen', () => {
    expect(aboutShouldAutoOpen({ ...base, scrollY: 500 })).toBe(false);
    expect(aboutShouldAutoOpen({ ...base, touched: true })).toBe(false);
  });
});

describe('recent passages and saved pairs', () => {
  it('lists distinct recent chapters, newest first, reading entries only', () => {
    const rows = [
      { ts: 1, type: 'read' as const, ref: 'JHN.3', label: 'John 3' },
      { ts: 3, type: 'read' as const, ref: 'GEN.1', label: 'Genesis 1' },
      { ts: 4, type: 'video' as const, ref: 'X.1', label: 'v' },
      { ts: 5, type: 'read' as const, ref: 'JHN.3', label: 'John 3' },
    ];
    expect(recentPassages(rows).map((r) => r.ref)).toEqual(['JHN.3', 'GEN.1']);
    expect(recentPassages(rows, 1)).toHaveLength(1);
  });
  it('saves a pair once, refuses a pair of one edition, and removes', () => {
    let l = addPair([], { left: 'webc', right: 'dra' });
    l = addPair(l, { left: 'webc', right: 'dra' });
    expect(l).toHaveLength(1);
    expect(addPair(l, { left: 'dra', right: 'dra' })).toHaveLength(1);
    l = addPair(l, { left: 'nabre', right: 'dra' });
    expect(l[0].left).toBe('nabre');
    expect(hasPair(l, { left: 'webc', right: 'dra' })).toBe(true);
    expect(removePair(l, { left: 'webc', right: 'dra' })).toHaveLength(1);
    expect(addPair([], { left: 'a', right: 'b' }, 0)).toHaveLength(0);
  });
});
