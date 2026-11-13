/**
 * Builds public/data/graph/graph.json: one normalised list of nodes and typed edges from data the app already ships.
 * Nothing is invented. An edge exists only where a source file states the link (a chain cites a passage, a topic lists a passage,
 * a step quotes a work, a work has an author, a topic names a related topic, a Catechism paragraph lies in a topic's range).
 *   npx tsx scripts/graph/build.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../../src/lib/canon';

const ROOT = process.cwd();
const rd = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

export type Kind = 'topic' | 'argument' | 'claim' | 'development' | 'heresy' | 'word' | 'life' | 'situation' | 'passage' | 'catechism' | 'work' | 'author';
export interface GNode { id: string; kind: Kind; label: string; sub?: string; to?: string }
export interface GEdge { a: string; b: string; type: string }
export interface Graph { generated: string; nodes: GNode[]; edges: GEdge[]; counts: Record<string, number> }

const nodes = new Map<string, GNode>();
const edges = new Map<string, GEdge>();
const node = (n: GNode) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return n.id; };
const edge = (a: string, b: string, type: string) => { if (a === b) return; const k = `${a}|${b}|${type}`; if (!edges.has(k)) edges.set(k, { a, b, type }); };

const bookName: Record<string, string> = Object.fromEntries(BOOKS.map((b) => [b.id, b.name]));

/** "JHN.6.53-56" or "MAT.26.26-29" -> the chapter node "passage:JHN.6" */
function passage(ref: string): string | null {
  const m = /^([1-3A-Z][A-Z0-9]{2})\.(\d+)/.exec(ref);
  if (!m) return null;
  const id = `passage:${m[1]}.${m[2]}`;
  return node({ id, kind: 'passage', label: `${bookName[m[1]] ?? m[1]} ${m[2]}`, to: `/read/webc/${m[1]}/${m[2]}` });
}
const ccc = (n: number) => node({ id: `ccc:${n}`, kind: 'catechism', label: `Catechism §${n}`, to: `/study/catechism/${n}` });

// library: work -> author
const lib = rd('public/data/library/index.json').works as { id: string; title: string; author: string; authorId: string }[];
const workInfo = new Map(lib.map((w) => [w.id, w]));
function work(id: string): string {
  const w = workInfo.get(id);
  const wid = node({ id: `work:${id}`, kind: 'work', label: w?.title ?? id, sub: w?.author, to: `/study/works/${id}` });
  if (w?.authorId) edge(wid, node({ id: `author:${w.authorId}`, kind: 'author', label: w.author, to: `/room?author=${w.authorId}` }), 'written by');
  return wid;
}

// doctrine topics
const doctrine = rd('public/data/doctrine/doctrine.json').topics as { id: string; title: string; ccc: [number, number][]; scripture: string[]; related?: string[] }[];
const topicIds = new Set(doctrine.map((t) => `topic:${t.id}`));
for (const t of doctrine) {
  const id = node({ id: `topic:${t.id}`, kind: 'topic', label: t.title, to: `/study/topics/${t.id}` });
  for (const r of t.scripture ?? []) { const p = passage(r); if (p) edge(id, p, 'lists passage'); }
  for (const r of t.related ?? []) if (topicIds.has(`topic:${r}`)) edge(id, `topic:${r}`, 'related to');
}

// chains
const MODES: [string, Kind, string][] = [['arguments', 'argument', '/study/arguments/'], ['claims', 'claim', '/study/claims/'], ['development', 'development', '/study/development/'], ['heresies', 'heresy', '/study/heresies/'], ['words', 'word', '/study/words/']];
const chainFiles = readdirSync(join(ROOT, 'src/data/chains')).filter((f) => f.endsWith('.json'));
const cited = new Set<number>();
interface StepLike { kind: string; ref?: string; work?: string; ccc?: number }
function steps(c: any): StepLike[] {
  return [...(c.steps ?? []), ...(c.objections ?? []).flatMap((o: any) => o.steps ?? []), ...(c.heresy?.advocate ?? [])];
}
for (const [mode, kind, base] of MODES) {
  for (const f of chainFiles.filter((x) => x === `${mode}.json` || x.startsWith(`${mode}.`))) {
    const list = rd(`src/data/chains/${f}`);
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!c.id || !c.title) continue;
      const id = node({ id: `${kind}:${c.id}`, kind, label: c.title, to: `${base}${c.id}` });
      for (const s of steps(c)) {
        if (s.ref) { const p = passage(s.ref); if (p) edge(id, p, 'cites passage'); }
        if (typeof s.ccc === 'number') { cited.add(s.ccc); edge(id, ccc(s.ccc), 'cites Catechism'); }
        if (s.work && workInfo.has(s.work)) edge(id, work(s.work), 'quotes');
      }
      for (const n of c.readNext ?? []) if (typeof n === 'number') { cited.add(n); edge(id, ccc(n), 'read next'); }
    }
  }
}

// lives and situations
for (const f of chainFiles.filter((x) => x.startsWith('lives.'))) {
  for (const l of rd(`src/data/chains/${f}`)) {
    if (!l.id || !l.name) continue;
    const id = node({ id: `life:${l.id}`, kind: 'life', label: l.name, sub: l.lifespan, to: `/study/lives/${l.id}` });
    for (const e of l.events ?? []) { const s = e.step; if (s?.work && workInfo.has(s.work)) edge(id, work(s.work), 'quotes'); if (s?.ref) { const p = passage(s.ref); if (p) edge(id, p, 'cites passage'); } }
  }
}
for (const f of chainFiles.filter((x) => x.startsWith('situations.'))) {
  for (const sit of rd(`src/data/chains/${f}`)) {
    if (!sit.id || !sit.title) continue;
    const id = node({ id: `situation:${sit.id}`, kind: 'situation', label: sit.title, to: `/study/mentors` });
    for (const m of sit.mentors ?? []) { const s = m.step; if (s?.work && workInfo.has(s.work)) edge(id, work(s.work), 'quotes'); if (typeof s?.ccc === 'number') { cited.add(s.ccc); edge(id, ccc(s.ccc), 'cites Catechism'); } }
    for (const n of sit.readNext ?? []) if (typeof n === 'number') { cited.add(n); edge(id, ccc(n), 'read next'); }
  }
}

// a topic covers every cited Catechism paragraph that lies in one of its ranges
for (const t of doctrine) for (const n of cited) if ((t.ccc ?? []).some(([a, b]) => n >= a && n <= b)) edge(`topic:${t.id}`, `ccc:${n}`, 'covers');

const counts: Record<string, number> = {};
for (const n of nodes.values()) counts[n.kind] = (counts[n.kind] ?? 0) + 1;
const graph: Graph = { generated: new Date().toISOString().slice(0, 10), nodes: [...nodes.values()], edges: [...edges.values()], counts };
writeFileSync(join(ROOT, 'public/data/graph/graph.json'), JSON.stringify(graph));
console.log('nodes', graph.nodes.length, 'edges', graph.edges.length, counts);
