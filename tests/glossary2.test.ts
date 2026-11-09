import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { GLOSSARY, lookupTerm } from '../src/data/glossary';
import { GLOSSARY2 } from '../src/data/glossary2';

const norm = (s: string) => s.toLowerCase().replace(/[“”"’']/g, '').replace(/\s+/g, ' ').trim();
const ccc = new Map<number, string>();
for (const f of fs.readdirSync('public/data/ccc')) if (/^p\d+\.json$/.test(f)) for (const p of JSON.parse(fs.readFileSync(`public/data/ccc/${f}`, 'utf8'))) ccc.set(p.n, p.t);

describe('glossary2', () => {
  it('adds about 200 new terms to the main glossary', () => {
    expect(GLOSSARY2.length).toBeGreaterThanOrEqual(190);
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(390);
  });
  it('uses no term or alias that the original glossary or another new entry already has', () => {
    const seen = new Map<string, string>();
    for (const g of GLOSSARY.slice(0, GLOSSARY.length - GLOSSARY2.length)) for (const k of [g.term, ...g.aliases]) seen.set(norm(k), g.term);
    for (const g of GLOSSARY2) for (const k of new Set([g.term, ...g.aliases].map(norm))) { expect(seen.get(k), `${k} (${g.term}) also used by ${seen.get(k)}`).toBeUndefined(); seen.set(k, g.term); }
  });
  it('has real fields and a Catechism paragraph that exists', () => {
    for (const g of GLOSSARY2) {
      expect(g.term.trim().length, g.term).toBeGreaterThan(1);
      expect(g.definition.length, g.term).toBeGreaterThan(40);
      expect(g.definition.length, g.term).toBeLessThan(420);
      expect(ccc.has(g.ccc), `${g.term} §${g.ccc}`).toBe(true);
      expect(g.aliases.every((a) => a.trim().length > 0), g.term).toBe(true);
    }
  });
  it('resolves every related term to a different glossary entry', () => {
    for (const g of GLOSSARY2) for (const r of g.related ?? []) { const x = lookupTerm(r); expect(x, `${g.term} -> ${r}`).toBeDefined(); expect(x!.term, `${g.term} -> ${r}`).not.toBe(g.term); }
  });
  it('does not use the words above or below', () => {
    for (const g of GLOSSARY2) expect(/\b(above|below)\b/i.test(`${g.term} ${g.aliases.join(' ')} ${g.definition}`), g.term).toBe(false);
  });
  it('finds new terms by name and alias', () => {
    expect(lookupTerm('thurible')?.term).toBe('Thurible');
    expect(lookupTerm('Censer')?.term).toBe('Thurible');
    expect(lookupTerm('hermeneutics')?.term).toBe('Hermeneutics');
  });
});
