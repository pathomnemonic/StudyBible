/** Questions the app already has a guided walk for, found by matching the words of what was asked. Nothing is generated: every suggestion is an existing page. */
import type { GNode } from './conceptGraph';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
/** crude stem: "baptize", "baptized", "baptism" share a prefix */
const same = (a: string, b: string) => a === b || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5));

export function relatedQuestions(terms: string[], nodes: Pick<GNode, 'kind' | 'label' | 'to'>[], max = 4): { label: string; to: string }[] {
  const qs = terms.flatMap(words);
  if (!qs.length) return [];
  return nodes
    .filter((n) => (n.kind === 'argument' || n.kind === 'claim') && n.to)
    .map((n) => ({ n, score: new Set(words(n.label).filter((w) => qs.some((q) => same(q, w)))).size }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.n.label.localeCompare(b.n.label))
    .slice(0, max)
    .map((x) => ({ label: x.n.label, to: x.n.to! }));
}
