import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvePlanReferences } from '../src/lib/planReferences';
import type { CountsEdition } from '../src/lib/refCheck';
import { parseRefs } from '../src/lib/refs';

const editions = (JSON.parse(readFileSync('public/data/editions.json', 'utf8')) as { editions: CountsEdition[] }).editions;
const refs = (s: string) => {
  const parsed = parseRefs(s);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.refs.map((x) => x.ref);
};

describe('reading-plan passage validation', () => {
  it('stores a verified typed passage in anchor numbering', () => {
    const result = resolvePlanReferences(refs('John 3:16'), editions);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.refs).toEqual([{ book: 'JHN', c1: 3, v1: 16, c2: 3, v2: 16 }]);
  });

  it('rejects a mixed day as a whole when one passage is unverified', () => {
    const result = resolvePlanReferences(refs('John 3:16; John 6:51-58'), editions);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/numbering|differ|unverified|approximate/i);
  });

  it('rejects a syntactically valid but nonexistent chapter', () => {
    const result = resolvePlanReferences(refs('John 99:1'), editions);
    expect(result.ok).toBe(false);
  });

  it('rejects verse-level conversion in every unaligned book', () => {
    for (const book of ['TOB', 'JDT', 'EST', 'SIR', 'DAN']) {
      const result = resolvePlanReferences([{ book, c1: 1, v1: 1, c2: 1, v2: 1 }], editions);
      expect(result.ok, book).toBe(false);
    }
  });
});
