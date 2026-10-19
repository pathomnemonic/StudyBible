import type { Collection, Note, Target, UserXref } from '../db/db';
import { formatRef, parseRefId } from './refs';

export type NodeKind = 'note' | 'question' | 'passage' | 'author' | 'doctrine' | 'catechism' | 'tag' | 'collection' | 'other';
export interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** for notes: local id; for passages: the chapter ref id */
  ref?: string;
  noteId?: number;
  weight: number;
}
export interface GEdge {
  a: string;
  b: string;
  /** an edge the app suggests (shared doctrine topic), not one the user made */
  suggested?: boolean;
}
export interface DoctrineLite {
  id: string;
  title: string;
  scripture: string[];
}

const chapterNode = (refIdStr: string): { id: string; label: string } | null => {
  const r = parseRefId(refIdStr);
  if (!r) return null;
  const label = formatRef({ book: r.book, c1: r.c1, c2: r.c1 }, { noDual: true });
  return { id: `p:${r.book}.${r.c1}`, label };
};

/**
 * A knowledge graph from the user's own study: notes (and questions), the passages (by chapter), authors/works, Catechism
 * paragraphs, doctrine topics and tags they connect, plus collections and personal cross-references. It is rebuilt from the
 * notes each time, so it grows as the user studies. Optional "suggested" edges link passages to doctrine topics that cite them.
 */
export function buildGraph(notes: Note[], collections: Collection[], xrefs: UserXref[], doctrine: DoctrineLite[] = [], suggest = false) {
  const nodes = new Map<string, GNode>();
  const edges = new Map<string, GEdge>();
  const node = (id: string, kind: NodeKind, label: string, extra: Partial<GNode> = {}) => {
    const n = nodes.get(id);
    if (n) n.weight++;
    else nodes.set(id, { id, kind, label, weight: 1, ...extra });
    return id;
  };
  const edge = (a: string, b: string, suggested = false) => {
    if (a === b) return;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!edges.has(k)) edges.set(k, { a, b, suggested });
  };
  const target = (from: string, t: Target) => {
    switch (t.type) {
      case 'passage': {
        const c = chapterNode(t.ref);
        if (c) edge(from, node(c.id, 'passage', c.label, { ref: t.ref }));
        break;
      }
      case 'catechism':
        edge(from, node(`c:${t.para}`, 'catechism', t.label ?? `CCC ${t.para}`));
        break;
      case 'topic':
        edge(from, node(`d:${t.topicId}`, 'doctrine', t.label));
        break;
      case 'commentary': {
        const who = /—\s*(.+)$/.exec(t.label)?.[1]?.trim();
        edge(from, who ? node(`a:${who.toLowerCase()}`, 'author', who) : node(`o:${t.itemId}`, 'other', t.label));
        break;
      }
      case 'work':
        edge(from, node(`w:${t.workId}`, 'author', t.label));
        break;
      default: {
        const o = t as { type: string; label?: string };
        edge(from, node(`o:${o.type}:${o.label ?? ''}`, 'other', o.label ?? o.type));
      }
    }
  };
  for (const n of notes) {
    const id = `n:${n.id}`;
    nodes.set(id, { id, kind: n.kind === 'question' ? 'question' : 'note', label: n.title?.trim() || n.body.replace(/\s+/g, ' ').slice(0, 48) || '(untitled)', noteId: n.id, weight: 1 });
    for (const t of n.targets) target(id, t);
    for (const tag of n.tags) edge(id, node(`t:${tag.toLowerCase()}`, 'tag', `#${tag}`));
  }
  for (const c of collections) {
    const id = `col:${c.id}`;
    nodes.set(id, { id, kind: 'collection', label: c.name, weight: 1 });
    for (const t of c.items) target(id, t);
  }
  for (const x of xrefs) {
    const a = chapterNode(x.from);
    const b = chapterNode(x.to);
    if (a && b) edge(node(a.id, 'passage', a.label, { ref: x.from }), node(b.id, 'passage', b.label, { ref: x.to }));
  }
  if (suggest) {
    const have = new Set([...nodes.values()].filter((n) => n.kind === 'passage').map((n) => n.id));
    for (const d of doctrine) {
      const hits = new Set<string>();
      for (const s of d.scripture) {
        const c = chapterNode(s);
        if (c && have.has(c.id)) hits.add(c.id);
      }
      if (!hits.size) continue;
      const did = node(`d:${d.id}`, 'doctrine', d.title);
      for (const h of hits) edge(did, h, true);
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
