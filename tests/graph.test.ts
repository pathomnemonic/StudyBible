import { describe, expect, it } from 'vitest';
import { buildGraph } from '../src/lib/graphData';
import type { Note } from '../src/db/db';

const note = (id: number, p: Partial<Note>): Note => ({ id, body: 'b', kind: 'note', targets: [], tags: [], createdAt: 1, updatedAt: 1, ...p });

describe('knowledge graph', () => {
  const notes = [
    note(1, { title: 'Bread of life', targets: [{ type: 'passage', ref: 'JHN.6.35' }, { type: 'catechism', para: 1374 }], tags: ['eucharist'] }),
    note(2, { kind: 'question', title: 'Why “flesh”?', targets: [{ type: 'passage', ref: 'JHN.6.53' }, { type: 'commentary', itemId: 'x', label: 'Tractate 26 — Augustine' }], tags: ['Eucharist'] }),
  ];
  it('links notes to chapters, authors, Catechism paragraphs and tags, merging repeats', () => {
    const g = buildGraph(notes, [], []);
    const ids = new Set(g.nodes.map((n) => n.id));
    expect(ids.has('p:JHN.6')).toBe(true); // both verses collapse to one chapter node
    expect(g.nodes.find((n) => n.id === 'p:JHN.6')!.weight).toBe(2);
    expect(ids.has('a:augustine')).toBe(true);
    expect(ids.has('c:1374')).toBe(true);
    expect(ids.has('t:eucharist')).toBe(true); // tags are case-insensitive
    expect(g.nodes.find((n) => n.id === 'n:2')!.kind).toBe('question');
    expect(g.edges.length).toBe(new Set(g.edges.map((e) => [e.a, e.b].sort().join('|'))).size);
  });
  it('adds doctrine topics only as marked suggestions', () => {
    const g = buildGraph(notes, [], [], [{ id: 'eucharist', title: 'Eucharist', scripture: ['JHN.6.22-71', 'GEN.1.1'] }], true);
    const d = g.edges.filter((e) => e.a === 'd:eucharist' || e.b === 'd:eucharist');
    expect(d.length).toBe(1);
    expect(d[0].suggested).toBe(true);
    expect(buildGraph(notes, [], [], [{ id: 'eucharist', title: 'Eucharist', scripture: ['JHN.6.22-71'] }], false).nodes.some((n) => n.id === 'd:eucharist')).toBe(false);
  });
});
