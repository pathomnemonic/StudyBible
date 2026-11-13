import { getJson } from '../data/loader';

export type Kind = 'topic' | 'argument' | 'claim' | 'development' | 'heresy' | 'word' | 'life' | 'situation' | 'passage' | 'catechism' | 'work' | 'author' | 'note';
export interface GNode { id: string; kind: Kind; label: string; sub?: string; to?: string }
export interface GEdge { a: string; b: string; type: string }
export interface ConceptGraph { generated: string; nodes: GNode[]; edges: GEdge[]; counts: Record<string, number> }

export const KIND_LABEL: Record<Kind, string> = {
  topic: 'Doctrine topics', argument: 'Arguments', claim: 'Claims checked', development: 'How teachings developed', heresy: 'Heresies', word: 'Key words', life: 'Lives of saints', situation: 'Situations',
  passage: 'Bible chapters', catechism: 'Catechism paragraphs', work: 'Works in the library', author: 'Authors', note: 'My notes',
};

let loaded: Promise<ConceptGraph | null> | null = null;
export const loadConceptGraph = () => (loaded ??= getJson<ConceptGraph>('graph/graph.json', true).catch(() => null));

export interface Index { byId: Map<string, GNode>; adj: Map<string, { to: string; type: string }[]> }
export function indexGraph(g: ConceptGraph): Index {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const adj = new Map<string, { to: string; type: string }[]>();
  const push = (a: string, to: string, type: string) => (adj.get(a) ?? adj.set(a, []).get(a)!).push({ to, type });
  for (const e of g.edges) { push(e.a, e.b, e.type); push(e.b, e.a, e.type); }
  return { byId, adj };
}

/** the neighbours of a node, grouped by the kind of the neighbour */
export function neighbours(ix: Index, id: string): { kind: Kind; items: { node: GNode; type: string }[] }[] {
  const groups = new Map<Kind, { node: GNode; type: string }[]>();
  const seen = new Set<string>();
  for (const { to, type } of ix.adj.get(id) ?? []) {
    const n = ix.byId.get(to);
    if (!n || seen.has(`${to}|${type}`)) continue;
    seen.add(`${to}|${type}`);
    (groups.get(n.kind) ?? groups.set(n.kind, []).get(n.kind)!).push({ node: n, type });
  }
  return [...groups].map(([kind, items]) => ({ kind, items: items.sort((a, b) => a.node.label.localeCompare(b.node.label, undefined, { numeric: true })) })).sort((a, b) => b.items.length - a.items.length);
}

/** the shortest chain of links between two nodes, or null when they are not connected */
export function shortestPath(ix: Index, from: string, to: string, maxDepth = 6): { id: string; via: string }[] | null {
  if (!ix.byId.has(from) || !ix.byId.has(to)) return null;
  if (from === to) return [{ id: from, via: '' }];
  const prev = new Map<string, { id: string; type: string }>();
  let frontier = [from];
  const seen = new Set([from]);
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next: string[] = [];
    for (const cur of frontier) {
      for (const { to: nb, type } of ix.adj.get(cur) ?? []) {
        if (seen.has(nb)) continue;
        seen.add(nb); prev.set(nb, { id: cur, type });
        if (nb === to) {
          const out: { id: string; via: string }[] = [];
          for (let at = to, via = prev.get(to)!.type; ; ) {
            out.unshift({ id: at, via });
            const p = prev.get(at);
            if (!p) break;
            at = p.id; via = prev.get(at)?.type ?? '';
          }
          return out;
        }
        next.push(nb);
      }
    }
    frontier = next;
  }
  return null;
}

/** Your own notes as an extra layer: each note joins the Bible chapters it is written on, and the argument it was written for (when it came from "Think it through"). */
export function personalLayer(
  notes: { id?: number; title?: string; body: string; kind: string; tags: string[]; targets: { type: string; ref?: string }[] }[],
  chapterOf: (ref: string) => { book: string; c: number; name: string } | null,
  has: (nodeId: string) => boolean,
): { nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = [], edges: GEdge[] = [];
  const extra = new Map<string, GNode>();
  for (const n of notes) {
    if (n.id == null) continue;
    const id = `note:${n.id}`;
    const label = (n.title || n.body.split('\n')[0] || 'A note').slice(0, 60);
    const mine: GEdge[] = [];
    for (const t of n.targets) {
      if (t.type !== 'passage' || !t.ref) continue;
      const ch = chapterOf(t.ref);
      if (!ch) continue;
      const pid = `passage:${ch.book}.${ch.c}`;
      if (!has(pid) && !extra.has(pid)) extra.set(pid, { id: pid, kind: 'passage', label: ch.name, to: `/read/webc/${ch.book}/${ch.c}` });
      mine.push({ a: id, b: pid, type: 'written on' });
    }
    for (const tag of n.tags) {
      const m = /^(argument|claim|development|heresy|word):(.+)$/.exec(tag);
      if (m && has(tag)) mine.push({ a: id, b: tag, type: 'written for' });
    }
    if (!mine.length) continue;
    nodes.push({ id, kind: 'note', label, sub: n.kind === 'question' ? 'a question' : undefined, to: `/library/notes/${n.id}` });
    edges.push(...mine);
  }
  return { nodes: [...nodes, ...extra.values()], edges };
}
