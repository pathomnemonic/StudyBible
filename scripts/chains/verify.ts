import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Chain, Life, Situation, Step } from '../../src/chains/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'public', 'data');
export const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, '');

const workCache = new Map<string, any>();
function work(id: string) {
  if (!workCache.has(id)) { const f = join(DATA, 'library', 'works', `${id}.json`); workCache.set(id, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null); }
  return workCache.get(id);
}
let CCC: Map<number, string> | null = null;
function ccc(n: number) {
  if (!CCC) { CCC = new Map(); const dir = join(DATA, 'ccc'); for (const f of readdirSync(dir)) if (/^p/.test(f)) for (const p of JSON.parse(readFileSync(join(dir, f), 'utf8'))) CCC.set(p.n, p.t); }
  return CCC.get(n);
}
function verseText(ref: string): string | undefined {
  const m = /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return undefined;
  const f = join(DATA, 'bible', 'webc', `${m[1]}.json`);
  if (!existsSync(f)) return undefined;
  const ch = JSON.parse(readFileSync(f, 'utf8')).chapters.find((c: any) => c.n === +m[2]);
  if (!ch) return undefined;
  const a = +m[3], b = m[4] ? +m[4] : a; let out = '';
  for (const blk of ch.blocks) for (const v of (blk[1] ?? [])) if (Array.isArray(v) && typeof v[0] === 'number' && v[0] >= a && v[0] <= b) out += ' ' + v[1];
  return out || undefined;
}
/** The source text a step points at, or an error */
export function sourceText(s: Step): { text?: string; err?: string } {
  if (s.kind === 'catechism' || (s.ccc && !s.work)) { const t = s.ccc ? ccc(s.ccc) : undefined; return t ? { text: t } : { err: `no Catechism paragraph ${s.ccc}` }; }
  if (s.butler) {
    const m = /^(\d\d)-(\d\d):(\d+)$/.exec(s.butler); if (!m) return { err: `butler must look like 01-10:0, got ${s.butler}` };
    const f = join(DATA, 'saints', 'butler', `${m[1]}.json`); if (!existsSync(f)) return { err: `no Butler month ${m[1]}` };
    const e = JSON.parse(readFileSync(f, 'utf8')).days?.[m[2]]?.[+m[3]]; if (!e) return { err: `no Butler entry ${s.butler}` };
    return { text: [e.name, ...e.text].join(' ') };
  }
  if (s.work) {
    const w = work(s.work); if (!w) return { err: `no work ${s.work}` };
    const sec = w.sections.find((x: any) => x.id === s.section); if (!sec) return { err: `no section ${s.section} in ${s.work}` };
    return { text: [sec.title, ...sec.paras].join(' ') };
  }
  if (s.ref) { const t = verseText(s.ref); return t ? { text: t } : { err: `cannot read ${s.ref} (use BOOK.c.v or BOOK.c.v1-v2 inside one chapter)` }; }
  return { err: 'step has no ref, work+section or ccc' };
}
export function verifyStep(s: Step, where: string): string[] {
  const bad: string[] = [];
  if (!s.note || s.note.length < 20) bad.push(`${where}: note missing or too short`);
  if (!s.label) bad.push(`${where}: no label`);
  const { text, err } = sourceText(s);
  if (err) { bad.push(`${where}: ${err}`); return bad; }
  if (s.quote) {
    const hay = norm(text!);
    for (const seg of s.quote.split(/…|\.\.\./)) {
      const n = norm(seg);
      if (n.length < 12) { bad.push(`${where}: quote stretch too short “${seg.trim().slice(0, 30)}”`); continue; }
      if (!hay.includes(n)) bad.push(`${where}: quote not found in source: “${seg.trim().slice(0, 70)}…”`);
    }
  } else if (s.kind !== 'scripture' && s.kind !== 'liturgy') bad.push(`${where}: ${s.kind} step needs a quote`);
  return bad;
}
export function verifyChain(c: Chain): string[] {
  const bad: string[] = [];
  if (!c.id || !c.title || !c.question || !c.summary) bad.push(`${c.id}: missing id/title/question/summary`);
  c.steps.forEach((s, i) => bad.push(...verifyStep(s, `${c.id} step ${i + 1}`)));
  (c.objections ?? []).forEach((o, i) => { if (!o.q || !o.a) bad.push(`${c.id} objection ${i + 1} incomplete`); (o.steps ?? []).forEach((s, j) => bad.push(...verifyStep(s, `${c.id} objection ${i + 1} step ${j + 1}`))); });
  if (c.verdict) { if (!c.verdict.label || !c.verdict.why || c.verdict.why.length < 40 || !c.verdict.origin || c.verdict.origin.length < 40) bad.push(`${c.id}: verdict needs label, why and origin`); }
  if (c.heresy) { c.heresy.advocate.forEach((s, i) => bad.push(...verifyStep(s, `${c.id} advocate ${i + 1}`))); for (const k of ['era', 'who', 'claim', 'appeal', 'whyItFails'] as const) if (!c.heresy[k]) bad.push(`${c.id}: heresy.${k} missing`); }
  return bad;
}
export function loadChains(mode: string): Chain[] {
  const dir = join(ROOT, 'src', 'data', 'chains');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f === `${mode}.json` || (f.startsWith(`${mode}.`) && f.endsWith('.json'))).sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Chain[]);
}

export function verifySituation(c: Situation): string[] {
  const bad: string[] = [];
  if (!c.id || !c.title || !c.ask || !c.intro) bad.push(`${c.id}: missing id/title/ask/intro`);
  if (!c.mentors?.length || c.mentors.length < 3) bad.push(`${c.id}: needs at least 3 mentors`);
  (c.mentors ?? []).forEach((m, i) => { if (!m.name || !m.lifespan || !m.why || m.why.length < 40) bad.push(`${c.id} mentor ${i + 1}: name/lifespan/why incomplete`); bad.push(...verifyStep(m.step, `${c.id} mentor ${i + 1} (${m.name})`)); });
  return bad;
}
export function verifyLife(c: Life): string[] {
  const bad: string[] = [];
  if (!c.id || !c.name || !c.lifespan || !c.sketch) bad.push(`${c.id}: missing id/name/lifespan/sketch`);
  if (!c.events || c.events.length < 8) bad.push(`${c.id}: needs at least 8 events`);
  let last = -9999;
  (c.events ?? []).forEach((e, i) => { if (e.year < last) bad.push(`${c.id} event ${i + 1}: out of order`); last = e.year; if (!e.text || e.text.length < 15) bad.push(`${c.id} event ${i + 1}: text too short`); if (e.step) bad.push(...verifyStep(e.step, `${c.id} event ${i + 1}`)); });
  if (!(c.events ?? []).some((e) => e.kind === 'setback')) bad.push(`${c.id}: include at least one setback`);
  if (!(c.events ?? []).some((e) => e.kind === 'world')) bad.push(`${c.id}: include world events for context`);
  return bad;
}
export function loadFiles<T>(prefix: string): T[] {
  const dir = join(ROOT, 'src', 'data', 'chains');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f === `${prefix}.json` || (f.startsWith(`${prefix}.`) && f.endsWith('.json'))).sort().flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as T[]);
}
