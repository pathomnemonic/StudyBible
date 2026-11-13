import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { indexGraph, neighbours, shortestPath, type ConceptGraph } from '../src/lib/conceptGraph';

const g = JSON.parse(readFileSync('public/data/graph/graph.json', 'utf8')) as ConceptGraph;
const ix = indexGraph(g);

describe('the normalised concept graph', () => {
  it('has unique node ids and every edge joins two real nodes', () => {
    expect(new Set(g.nodes.map((n) => n.id)).size).toBe(g.nodes.length);
    for (const e of g.edges) { expect(ix.byId.has(e.a), e.a).toBe(true); expect(ix.byId.has(e.b), e.b).toBe(true); expect(e.a).not.toBe(e.b); }
  });
  it('has no repeated edge', () => {
    expect(new Set(g.edges.map((e) => `${e.a}|${e.b}|${e.type}`)).size).toBe(g.edges.length);
  });
  it('gives every node a readable label and a link that stays inside the app', () => {
    for (const n of g.nodes) { expect(n.label.trim().length, n.id).toBeGreaterThan(0); if (n.to) expect(n.to.startsWith('/'), n.id).toBe(true); expect(n.label, n.id).not.toMatch(/^[A-Z0-9]{3} \d+$/); }
  });
  it('connects a doctrine topic to the passages it lists', () => {
    const groups = neighbours(ix, 'topic:eucharist');
    expect(groups.some((x) => x.kind === 'passage')).toBe(true);
  });
  it('finds the shortest chain between two things and says how each link is made', () => {
    const p = shortestPath(ix, 'topic:eucharist', 'argument:real-presence');
    expect(p).not.toBeNull();
    expect(p![0].id).toBe('topic:eucharist');
    expect(p![p!.length - 1].id).toBe('argument:real-presence');
    expect(p!.slice(1).every((s) => s.via.length > 0)).toBe(true);
  });
  it('returns null for two nodes that are not connected, and for an unknown node', () => {
    expect(shortestPath(ix, 'topic:eucharist', 'nope')).toBeNull();
  });
});
