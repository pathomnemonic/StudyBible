import { describe, expect, it } from 'vitest';
import { GLOSSARY, lookupTerm } from '../src/data/glossary';

describe('glossary', () => {
  it('has unique terms with a real definition and a Catechism paragraph', () => {
    expect(new Set(GLOSSARY.map((g) => g.term.toLowerCase())).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) { expect(g.definition.length, g.term).toBeGreaterThan(30); expect(g.ccc, g.term).toBeGreaterThan(0); expect(g.ccc, g.term).toBeLessThanOrEqual(2865); }
  });
  it('finds a term by its name, plural, alias or any capitalization', () => {
    expect(lookupTerm('Transubstantiation')?.term).toBe('Transubstantiation');
    expect(lookupTerm('indulgences')?.term).toBe('Indulgence');
    expect(lookupTerm('LAST RITES')?.term).toBe('Anointing of the Sick');
    expect(lookupTerm('banana')).toBeUndefined();
  });
});
