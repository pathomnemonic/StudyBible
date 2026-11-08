import { describe, expect, it } from 'vitest';
import { checkApostolic, loadApostolic } from '../scripts/chains/check-apostolic';

describe('apostolic chain', () => {
  it('every node, edge and quotation is found in the bundled text it cites', () => {
    expect(checkApostolic(loadApostolic()).slice(0, 25)).toEqual([]);
  });
});
