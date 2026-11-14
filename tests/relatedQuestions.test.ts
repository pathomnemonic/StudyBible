import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { relatedQuestions } from '../src/lib/relatedQuestions';

const nodes = JSON.parse(readFileSync('public/data/graph/graph.json', 'utf8')).nodes;
describe('related guided questions', () => {
  it('finds the guided walk on infant baptism for a baptism question', () => {
    const r = relatedQuestions(['baptize', 'infants'], nodes);
    expect(r.map((x) => x.label)).toContain('Why Baptize Infants?');
    expect(r[0].to).toMatch(/^\/study\/(arguments|claims)\//);
  });
  it('returns nothing for words that match no walk, and never more than asked', () => {
    expect(relatedQuestions(['zebra'], nodes)).toEqual([]);
    expect(relatedQuestions(['church', 'mary', 'god'], nodes, 2).length).toBeLessThanOrEqual(2);
    expect(relatedQuestions([], nodes)).toEqual([]);
  });
  it('ignores people, works and other kinds of node', () => {
    expect(relatedQuestions(['aquinas'], [{ kind: 'author', label: 'Thomas Aquinas', to: '/x' }])).toEqual([]);
  });
});
