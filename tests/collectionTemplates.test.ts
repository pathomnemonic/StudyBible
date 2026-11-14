import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRefs } from '../src/lib/refs';

// the templates live in a page component, so read their references straight from the source and check each one is a real passage
const src = readFileSync('src/pages/library/LibraryHome.tsx', 'utf8');
const block = src.slice(src.indexOf('COLLECTION_TEMPLATES'), src.indexOf('async function startTemplate'));
const refs = [...block.matchAll(/refs: \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
describe('collection templates', () => {
  it('have references and every one parses as a passage', () => {
    expect(refs.length).toBeGreaterThan(15);
    for (const r of refs) expect(parseRefs(r).ok, r).toBe(true);
  });
});
