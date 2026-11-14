import { describe, expect, it } from 'vitest';
import { askSourcesParam, parseAskSources, toggleAskSource } from '../src/lib/askSources';

describe('Ask the sources filters', () => {
  it('defaults to every source and ignores junk', () => {
    expect(parseAskSources(null)).toEqual(['ccc', 'bible', 'fathers']);
    expect(parseAskSources('nonsense')).toEqual(['ccc', 'bible', 'fathers']);
    expect(parseAskSources('fathers,ccc')).toEqual(['ccc', 'fathers']);
  });
  it('writes nothing to the address when all are on', () => {
    expect(askSourcesParam(['ccc', 'bible', 'fathers'])).toBeUndefined();
    expect(askSourcesParam(['bible'])).toBe('bible');
  });
  it('toggles, keeps at least one, keeps a stable order', () => {
    expect(toggleAskSource(['ccc', 'bible', 'fathers'], 'bible')).toEqual(['ccc', 'fathers']);
    expect(toggleAskSource(['ccc'], 'ccc')).toEqual(['ccc']);
    expect(toggleAskSource(['fathers'], 'ccc')).toEqual(['ccc', 'fathers']);
  });
});
