import { describe, expect, it } from 'vitest';
import { loadChains, verifyChain } from '../scripts/chains/verify';

describe('sourced chains', () => {
  for (const mode of ['arguments', 'development', 'heresies', 'words']) {
    it(`${mode}: every quotation is found in the source it cites`, () => {
      const cs = loadChains(mode);
      const ids = cs.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      const bad = cs.flatMap(verifyChain);
      expect(bad.slice(0, 20)).toEqual([]);
    });
  }
});
