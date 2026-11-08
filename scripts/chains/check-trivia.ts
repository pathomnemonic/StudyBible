import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStep } from './verify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TRIVIA_CATS = ['scripture', 'saints', 'history', 'doctrine', 'liturgy', 'prayer'] as const;
export interface TriviaQ { id: string; d: 1 | 2 | 3; q: string; o: string[]; a: number; why: string; src: any }
export function loadTrivia(cat: string): TriviaQ[] {
  const dir = join(ROOT, 'src', 'data', 'trivia');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f === `${cat}.json` || (f.startsWith(`${cat}.`) && f.endsWith('.json'))).sort().flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as TriviaQ[]);
}
export function checkTrivia(cat: string, qs: TriviaQ[]): string[] {
  const bad: string[] = []; const ids = new Set<string>(); const stems = new Set<string>(); let longest = 0;
  for (const x of qs) {
    const w = `${cat} ${x.id}`;
    if (!x.id || ids.has(x.id)) bad.push(`${w}: missing or duplicate id`); ids.add(x.id);
    if (![1, 2, 3].includes(x.d)) bad.push(`${w}: d must be 1, 2 or 3`);
    if (!x.q || x.q.length < 12 || x.q.length > 220) bad.push(`${w}: question length`);
    const sk = x.q.toLowerCase().replace(/[^a-z0-9]+/g, ''); if (stems.has(sk)) bad.push(`${w}: duplicate question`); stems.add(sk);
    if (!Array.isArray(x.o) || x.o.length !== 4 || new Set(x.o.map((s) => String(s).trim().toLowerCase())).size !== 4) bad.push(`${w}: needs 4 distinct options`);
    else {
      if (!(x.a >= 0 && x.a <= 3)) bad.push(`${w}: answer index`);
      if (x.o.some((s) => !String(s).trim() || String(s).length > 90)) bad.push(`${w}: option empty or over 90 chars`);
      if (x.o[x.a]?.length === Math.max(...x.o.map((s) => s.length))) longest++;
    }
    if (!x.why || x.why.length < 20) bad.push(`${w}: why too short`);
    if (!x.src) bad.push(`${w}: src missing`); else { if (!x.src.label) x.src.label = 'Source'; if (!x.src.note) x.src.note = x.why; bad.push(...verifyStep(x.src, w)); }
  }
  if (qs.length >= 30 && longest / qs.length > 0.4) bad.push(`${cat}: the correct answer is the longest option in ${Math.round((100 * longest) / qs.length)}% of questions (max 40%); lengthen distractors`);
  return bad;
}
if (process.argv[1] && process.argv[1].endsWith('check-trivia.ts')) {
  const cats = process.argv[2] ? [process.argv[2]] : [...TRIVIA_CATS]; let n = 0;
  for (const c of cats) { const qs = loadTrivia(c); const bad = checkTrivia(c, qs); bad.forEach((b) => console.log(b)); n += bad.length; const dd = [1, 2, 3].map((d) => qs.filter((x) => x.d === d).length); console.log(`${c}: ${qs.length} questions (easy ${dd[0]}, medium ${dd[1]}, hard ${dd[2]})`); }
  console.log(n ? `${n} problems` : 'trivia ok'); process.exit(n ? 1 : 0);
}
