import { describe, expect, it } from 'vitest';
import { citedScripture } from '../src/lib/citedScripture';

describe('Scripture cited in Catechism footnotes', () => {
  it('finds each passage once, in order, and ignores what is not Scripture', () => {
    const r = citedScripture(['Jn 6:51; cf. Mt 26:26', 'LG 11; Jn 6:51', 'Council of Trent: DS 1651']);
    expect(r.map((x) => `${x.book}.${x.c1}.${x.v1 ?? ''}`)).toEqual(['JHN.6.51', 'MAT.26.26']);
  });
  it('stops at the limit', () => {
    expect(citedScripture(['Gen 1:1; Ex 3:14; Lev 19:2; Num 6:24; Dt 6:4'], 3)).toHaveLength(3);
  });
});
