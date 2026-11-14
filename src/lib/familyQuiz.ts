/** "Family ties": who was the father or mother of this person? Built only from the app's own genealogies of Scripture; each answer shows where Scripture says it. */
import { seeded, shuffled } from './dailyGame';
import type { Person } from '../study/refData';

export interface FamilyQ { text: string; options: string[]; answer: number; ref?: string }

export function buildFamilyQuiz(persons: Person[], seed: number, n = 6): FamilyQ[] {
  const rnd = seeded(seed);
  const byId = new Map(persons.map((p) => [p.id, p]));
  // a person with a note has some complication (a variant line, a half-sibling): leave those out so every answer is clear
  const clear = persons.filter((p) => !p.note);
  const fathers = [...new Set(persons.map((p) => p.f).filter((x): x is string => !!x && byId.has(x)))].map((id) => byId.get(id)!);
  const mothers = [...new Set(persons.map((p) => p.m).filter((x): x is string => !!x && byId.has(x)))].map((id) => byId.get(id)!);
  const pool: { p: Person; role: 'father' | 'mother'; right: Person }[] = [];
  for (const p of clear) {
    if (p.f && byId.has(p.f) && fathers.length >= 4) pool.push({ p, role: 'father', right: byId.get(p.f)! });
    if (p.m && byId.has(p.m) && mothers.length >= 4) pool.push({ p, role: 'mother', right: byId.get(p.m)! });
  }
  const out: FamilyQ[] = [];
  const used = new Set<string>();
  for (const q of shuffled(pool, rnd)) {
    if (used.has(q.p.id)) continue;
    const wrong = shuffled((q.role === 'father' ? fathers : mothers).filter((x) => x.id !== q.right.id && x.id !== q.p.id), rnd).slice(0, 3);
    if (wrong.length < 3) continue;
    used.add(q.p.id);
    const opts = shuffled([q.right, ...wrong], rnd);
    out.push({ text: `Who was the ${q.role} of ${q.p.n}?`, options: opts.map((o) => o.n), answer: opts.indexOf(q.right), ref: q.p.r });
    if (out.length === n) break;
  }
  return out;
}
