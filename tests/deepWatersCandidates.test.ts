// ChatGPT's candidate bank: answers drawn from the app's own data with their source, kept apart from the game until a person reviews them.
import { describe, expect, it } from 'vitest';
import { GENERATED_DEEP_CANDIDATES } from '../src/lib/deepWatersBankGenerator';
// the candidate bank was built with this plain normalisation (letters and digits only), so it is checked with the same one
const normalizeDeepAnswer = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');

describe('Basilion candidate bank', () => {
  it('generates a provenance-backed candidate bank without inventing rarity tiers', () => {
    expect(GENERATED_DEEP_CANDIDATES.length).toBeGreaterThan(100);
    const keys = GENERATED_DEEP_CANDIDATES.map((row) => row.category + ':' + normalizeDeepAnswer(row.answer));
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of GENERATED_DEEP_CANDIDATES) {
      expect(row.answer.trim().length).toBeGreaterThan(1);
      expect(row.source.trim().length).toBeGreaterThan(0);
      expect(row.sourceId.trim().length).toBeGreaterThan(0);
      expect(row.evidence.trim().length).toBeGreaterThan(0);
      expect(row.reviewStatus).toBe('needs-review');
      expect(row.tier).toBeNull();
    }
  });
});
