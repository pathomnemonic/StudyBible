import { describe, expect, it } from 'vitest';
import { loadChains, loadFiles, verifyChain, verifyLife, verifySituation } from '../scripts/chains/verify';
import type { Life, Situation } from '../src/chains/types';

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
  it('situations: every mentor quotation is found in its source', () => { expect(loadFiles<Situation>('situations').flatMap(verifySituation).slice(0, 20)).toEqual([]); });
  it('lives: events are ordered and every quotation is found', () => { expect(loadFiles<Life>('lives').flatMap(verifyLife).slice(0, 20)).toEqual([]); });
});

import { checkTimeline, loadTimeline } from '../scripts/chains/check-timeline';
describe('church timeline', () => {
  it('events are ordered, inside the map, match the councils, and every quotation is found', () => { expect(checkTimeline(loadTimeline()).slice(0, 20)).toEqual([]); });
});
