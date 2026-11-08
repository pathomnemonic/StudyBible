import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStep } from './verify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KINDS = ['taught', 'heard', 'succeeded', 'wrote-to', 'wrote-about'] as const;
export interface ChainNode { id: string; branch: string; name: string; years: string; from: number; to: number; role: string; place: string; authorId?: string; read?: { work: string; section?: string; label: string }; words?: { quote: string; work: string; section: string; note: string }[] }
export interface ChainEdge { from: string; to: string; kind: (typeof KINDS)[number]; quote: string; work?: string; section?: string; ref?: string; voice: 'text' | 'editor' | 'scripture'; disputed?: boolean; note: string }
export interface TradEdge { from: string; to: string; note: string }
export interface ApostolicData { nodes: ChainNode[]; edges: ChainEdge[]; traditional: TradEdge[] }

export function loadApostolic(): ApostolicData {
  return JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'apostolicChain.json'), 'utf8'));
}
export function checkApostolic(d: ApostolicData): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  const authors = new Set<string>(JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'library', 'index.json'), 'utf8')).works.map((w: any) => w.authorId));
  for (const n of d.nodes) {
    if (ids.has(n.id)) bad.push(`${n.id}: duplicate node`); ids.add(n.id);
    if (!n.name || !n.years || !n.role || !n.place || n.role.length < 15) bad.push(`${n.id}: name/years/role/place missing`);
    if (typeof n.from !== 'number' || typeof n.to !== 'number' || n.to < n.from) bad.push(`${n.id}: bad from/to years`);
    if (n.authorId && !authors.has(n.authorId)) bad.push(`${n.id}: authorId ${n.authorId} not in the library index`);
    if (n.read) bad.push(...verifyStep({ kind: 'father', label: n.read.label, work: n.read.work, section: n.read.section ?? '', quote: undefined, note: 'reading link target for the node page' } as any, `${n.id} read`).filter((m) => !/needs a quote/.test(m)));
    (n.words ?? []).forEach((w, i) => bad.push(...verifyStep({ kind: 'father', label: n.name, work: w.work, section: w.section, quote: w.quote, note: w.note } as any, `${n.id} words ${i + 1}`)));
  }
  d.edges.forEach((e, i) => {
    const where = `edge ${i + 1} ${e.from}->${e.to} (${e.kind})`;
    if (!ids.has(e.from) || !ids.has(e.to)) bad.push(`${where}: unknown node`);
    if (!KINDS.includes(e.kind)) bad.push(`${where}: bad kind`);
    if (!e.quote) { bad.push(`${where}: sourced edges need a quote`); return; }
    if (!['text', 'editor', 'scripture'].includes(e.voice)) bad.push(`${where}: voice must be text, editor or scripture`);
    if ((e.voice === 'scripture') !== !!e.ref) bad.push(`${where}: scripture voice goes with ref only`);
    bad.push(...verifyStep({ kind: e.ref ? 'scripture' : 'father', label: `${e.from} to ${e.to}`, work: e.work, section: e.section, ref: e.ref, quote: e.quote, note: e.note } as any, where));
  });
  const seen = new Set(d.edges.map((e) => `${e.from}|${e.to}`));
  d.traditional.forEach((t, i) => {
    if (!ids.has(t.from) || !ids.has(t.to)) bad.push(`traditional ${i + 1}: unknown node`);
    if (!t.note || t.note.length < 30) bad.push(`traditional ${i + 1}: needs a plain note`);
    if ((t as any).quote) bad.push(`traditional ${i + 1}: must not carry a quote`);
    if (seen.has(`${t.from}|${t.to}`)) bad.push(`traditional ${i + 1}: already sourced`);
  });
  // every node connects to something
  const used = new Set([...d.edges, ...d.traditional].flatMap((e) => [e.from, e.to]));
  for (const n of d.nodes) if (!used.has(n.id)) bad.push(`${n.id}: no edges`);
  if (d.nodes.length < 35 || d.edges.length < 40) bad.push(`too small: ${d.nodes.length} nodes, ${d.edges.length} edges`);
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('check-apostolic.ts')) {
  const bad = checkApostolic(loadApostolic());
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); } else console.log('apostolic chain ok');
}
