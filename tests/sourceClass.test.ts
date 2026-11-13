import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { groupOf } from '../src/lib/fathersSearch';
import { classOf, SOURCE_CLASS } from '../src/lib/sourceClass';

describe('source classes', () => {
  const works = (JSON.parse(readFileSync('public/data/library/index.json', 'utf8')) as { works: { id: string; authority: string; kind: string }[] }).works;
  it('gives every work in the library a class with a label and a note', () => {
    for (const w of works) { const c = classOf(groupOf(w as never)); expect(SOURCE_CLASS[c], w.id).toBeTruthy(); expect(SOURCE_CLASS[c].label.length).toBeGreaterThan(3); }
  });
  it('keeps councils and Church documents apart from individual writers', () => {
    expect(classOf('Councils')).toBe('official');
    expect(classOf('Church documents')).toBe('official');
    expect(classOf('Fathers')).toBe('father');
    expect(classOf('Saints')).toBe('saint');
    expect(classOf('Scholarship')).toBe('scholar');
  });
  it('never labels a Father or a saint as official teaching', () => {
    for (const w of works.filter((x) => x.authority === 'father' && x.kind !== 'council')) expect(classOf(groupOf(w as never)), w.id).not.toBe('official');
  });
});
