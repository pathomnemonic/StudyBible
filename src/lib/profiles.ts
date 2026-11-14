/**
 * Profiles of saints, biblical people and places.
 * The app ships the structure and the checks; the facts come only from reviewed data files (see docs/PROFILE_DATA_FORMAT.md).
 * Every statement must name a source, and an uncertain statement must say so, so nothing here can be a bare assertion.
 */
export type ProfileKind = 'saint' | 'person' | 'place';
export type Confidence = 'certain' | 'probable' | 'disputed';
export type SourceKind = 'scripture' | 'magisterium' | 'historical' | 'editorial';

export interface ProfileSource { label: string; kind: SourceKind; url?: string }
export interface ProfileFact { text: string; source: ProfileSource; confidence?: Confidence }
export interface Profile {
  /** stable and never reused: lower-case letters, digits and hyphens, e.g. "thomas-aquinas" */
  id: string;
  kind: ProfileKind;
  name: string;
  /** other names and spellings people may search for (Latin forms, religious names, old spellings) */
  alternateNames?: string[];
  /** the writer's id in the library, when the person wrote something in it */
  authorId?: string;
  /** feast day as "MM-DD", linking to the liturgical calendar */
  feast?: string;
  period?: { from?: number; to?: number; note?: string };
  /** Scripture passages (anchor ids such as JHN.6.51-58) where the person or place appears */
  passages?: string[];
  /** ids of other profiles this one is documented as related to, each with the kind of relation */
  related?: { id: string; relation: string; source: ProfileSource }[];
  /** places: the ancient name and any proposed modern identification, with how sure it is */
  identification?: { ancient?: string; modern?: string; confidence: Confidence; source: ProfileSource };
  facts: ProfileFact[];
}
export interface ProfileFile { version: 1; profiles: Profile[] }

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KINDS: ProfileKind[] = ['saint', 'person', 'place'];
const SOURCE_KINDS: SourceKind[] = ['scripture', 'magisterium', 'historical', 'editorial'];
const CONF: Confidence[] = ['certain', 'probable', 'disputed'];

function checkSource(s: unknown, where: string, errs: string[]) {
  const x = s as ProfileSource | undefined;
  if (!x || typeof x.label !== 'string' || !x.label.trim()) return void errs.push(`${where}: a source needs a label`);
  if (!SOURCE_KINDS.includes(x.kind)) errs.push(`${where}: source kind must be one of ${SOURCE_KINDS.join(', ')}`);
}

/** every problem found in a profile file, one line each; an empty list means the file may be loaded */
export function validateProfiles(file: unknown): string[] {
  const errs: string[] = [];
  const f = file as ProfileFile;
  if (!f || f.version !== 1 || !Array.isArray(f.profiles)) return ['the file must be {"version":1,"profiles":[...]}'];
  const seen = new Set<string>();
  for (const p of f.profiles) {
    const w = `profile “${p?.id ?? '?'}”`;
    if (!p || typeof p.id !== 'string' || !ID.test(p.id)) { errs.push(`${w}: id must be lower-case words joined by hyphens`); continue; }
    if (seen.has(`${p.kind}:${p.id}`)) errs.push(`${w}: id used twice for the same kind`);
    seen.add(`${p.kind}:${p.id}`);
    if (!KINDS.includes(p.kind)) errs.push(`${w}: kind must be saint, person or place`);
    if (!p.name?.trim()) errs.push(`${w}: a name is required`);
    if (p.feast && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(p.feast)) errs.push(`${w}: feast must be MM-DD`);
    if (p.period?.from != null && p.period.to != null && p.period.from > p.period.to) errs.push(`${w}: period starts after it ends`);
    if (!Array.isArray(p.facts) || p.facts.length === 0) errs.push(`${w}: at least one sourced fact is required`);
    for (const [i, fact] of (p.facts ?? []).entries()) {
      if (!fact.text?.trim()) errs.push(`${w}: fact ${i + 1} has no text`);
      checkSource(fact.source, `${w}: fact ${i + 1}`, errs);
      if (fact.confidence && !CONF.includes(fact.confidence)) errs.push(`${w}: fact ${i + 1} confidence must be certain, probable or disputed`);
    }
    for (const r of p.related ?? []) checkSource(r.source, `${w}: relation to ${r.id}`, errs);
    if (p.identification) {
      if (!CONF.includes(p.identification.confidence)) errs.push(`${w}: an identification must say how sure it is`);
      checkSource(p.identification.source, `${w}: identification`, errs);
    }
  }
  // a relation points at a profile of the same kind (the person Peter is not the saint Peter)
  const keys = new Set(f.profiles.map((p) => `${p?.kind}:${p?.id}`));
  for (const p of f.profiles) for (const r of p?.related ?? []) if (!keys.has(`${p.kind}:${r.id}`)) errs.push(`profile “${p.id}”: related profile “${r.id}” is not in the file`);
  return errs;
}

/** profiles whose name or any alternate name contains what was typed (ignoring case and accents) */
export function findProfiles(list: Profile[], query: string, kind?: ProfileKind): Profile[] {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = n(query);
  if (!q) return [];
  return list.filter((p) => (!kind || p.kind === kind) && [p.name, ...(p.alternateNames ?? [])].some((x) => n(x).includes(q)));
}

/** The relation labels a profile may use, with what each means structurally. `inverse` lists the labels the other profile may use back. */
export const RELATIONS: Record<string, { between: ProfileKind[]; inverse: string[]; generational?: 'parent' | 'child' }> = {
  'brother of': { between: ['person', 'saint'], inverse: ['brother of', 'sister of'] },
  'sister of': { between: ['person', 'saint'], inverse: ['brother of', 'sister of'] },
  'husband of': { between: ['person', 'saint'], inverse: ['wife of'] },
  'wife of': { between: ['person', 'saint'], inverse: ['husband of'] },
  'father of': { between: ['person', 'saint'], inverse: ['son of', 'daughter of'], generational: 'parent' },
  'mother of': { between: ['person', 'saint'], inverse: ['son of', 'daughter of'], generational: 'parent' },
  'son of': { between: ['person', 'saint'], inverse: ['father of', 'mother of'], generational: 'child' },
  'daughter of': { between: ['person', 'saint'], inverse: ['father of', 'mother of'], generational: 'child' },
  'great-grandmother of': { between: ['person', 'saint'], inverse: [] },
  'companion of': { between: ['person', 'saint'], inverse: ['companion of'] },
  'kinswoman of': { between: ['person', 'saint'], inverse: ['kinswoman of'] },
  'successor of': { between: ['person', 'saint'], inverse: [] },
  'mentor of': { between: ['person', 'saint'], inverse: ['disciple of'] },
  'disciple of': { between: ['person', 'saint'], inverse: ['mentor of'] },
  'anointer of': { between: ['person', 'saint'], inverse: ['anointed by'] },
  'anointed by': { between: ['person', 'saint'], inverse: ['anointer of'] },
  'sent in the spirit of': { between: ['person', 'saint'], inverse: [] },
  'witness at the stoning of': { between: ['person', 'saint'], inverse: [] },
};

/** the longest line of descent allowed, in generations (people, counting both ends) */
export const MAX_GENERATIONS = 60;

/** the same name written two ways for two different people, known and accepted (a search for it shows both) */
const HOMONYMS = new Set(['mariam']);
const PASSAGE = /^[A-Z0-9]{3}\.\d{1,3}(?:\.\d{1,3}(?:-\d{1,3}(?:\.\d{1,3})?)?|-\d{1,3})?$/; // JHN.3 · JHN.3.16 · MAT.16.13-19 · 1SA.9.15-10.1 (across a chapter) · PSA.1-3
const fold = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Structural rules beyond the field checks above (nothing here judges whether a fact is true):
 * relation labels from the list, between kinds that can have them, no self-links, no repeated relation, no parent/child cycles,
 * a bounded depth, one name for two profiles of the same kind only when listed, and well-formed passage references.
 */
export function validateProfileGraph(file: ProfileFile): string[] {
  const errs: string[] = [];
  const list = file.profiles ?? [];
  const byKey = new Map(list.map((p) => [`${p.kind}:${p.id}`, p]));
  const parents = new Map<string, string[]>(); // child key -> parent keys, for cycle and depth checks
  for (const p of list) {
    const me = `${p.kind}:${p.id}`;
    const w = `profile “${p.id}”`;
    const seen = new Set<string>();
    for (const r of p.related ?? []) {
      if (!r.id?.trim()) { errs.push(`${w}: a relation has no target`); continue; }
      if (!r.relation?.trim()) { errs.push(`${w}: relation to ${r.id} has no label`); continue; }
      if (r.id === p.id) errs.push(`${w}: relates to itself (“${r.relation}”)`);
      const def = RELATIONS[r.relation];
      if (!def) errs.push(`${w}: relation “${r.relation}” is not in the list of allowed relations (add it to RELATIONS if it is new)`);
      else if (!def.between.includes(p.kind)) errs.push(`${w}: a ${p.kind} cannot be “${r.relation}” anyone`);
      const key = `${r.id}|${r.relation}`;
      if (seen.has(key)) errs.push(`${w}: “${r.relation}” ${r.id} is listed twice`);
      seen.add(key);
      const target = byKey.get(`${p.kind}:${r.id}`);
      if (target && def && !def.between.includes(target.kind)) errs.push(`${w}: ${r.id} is a ${target.kind}, which cannot be on the end of “${r.relation}”`);
      if (def?.generational === 'child') parents.set(me, [...(parents.get(me) ?? []), `${p.kind}:${r.id}`]);
      if (def?.generational === 'parent') parents.set(`${p.kind}:${r.id}`, [...(parents.get(`${p.kind}:${r.id}`) ?? []), me]);
    }
    for (const ref of p.passages ?? []) if (!PASSAGE.test(ref)) errs.push(`${w}: passage reference “${ref}” is not well formed (like JHN.3.16 or MAT.16.13-19)`);
  }
  // a person is never their own ancestor, and the longest line of descent stays within MAX_GENERATIONS.
  // Iterative with a memo: a node's line is 1 + the longest line among its parents, worked out once however many branches reach it.
  const line = new Map<string, number>(); // key -> number of generations from the earliest ancestor down to this person, counting both
  const seenCycles = new Set<string>();
  for (const start of parents.keys()) {
    if (line.has(start)) continue;
    const stack: { k: string; i: number }[] = [{ k: start, i: 0 }];
    const onPath = new Set<string>([start]);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const ps = parents.get(top.k) ?? [];
      if (top.i < ps.length) {
        const par = ps[top.i++];
        if (onPath.has(par)) {
          const trail = [...stack.map((x) => x.k)]; const cyc = [...trail.slice(trail.indexOf(par)), par];
          const id = [...cyc.slice(0, -1)].sort().join('|');
          if (!seenCycles.has(id)) { seenCycles.add(id); errs.push(`parent and child relations form a cycle: ${cyc.join(' → ')}`); }
        } else if (!line.has(par)) { stack.push({ k: par, i: 0 }); onPath.add(par); }
      } else {
        // every parent is settled (or part of a reported cycle, which counts as nothing)
        let best = 0; for (const par of ps) best = Math.max(best, line.get(par) ?? 0);
        line.set(top.k, 1 + best);
        onPath.delete(top.k); stack.pop();
      }
    }
  }
  for (const [k, n] of line) if (n > MAX_GENERATIONS) errs.push(`the line of descent through ${k} is ${n} generations deep (the limit is ${MAX_GENERATIONS})`);
  // names: one name must not point at two profiles of the same kind (the person and the saint of one name are different kinds on purpose)
  const names = new Map<string, Set<string>>();
  for (const p of list) for (const n of [p.name, ...(p.alternateNames ?? [])]) { const k = `${p.kind}:${fold(n)}`; (names.get(k) ?? names.set(k, new Set()).get(k)!).add(p.id); }
  for (const [k, ids] of names) if (ids.size > 1 && !HOMONYMS.has(k.split(':')[1])) errs.push(`the name “${k.split(':')[1]}” belongs to more than one ${k.split(':')[0]} profile: ${[...ids].join(', ')}`);
  return errs;
}

/** Relations whose other end does not say it back (informational: not every link has a written counterpart). */
export function relationGaps(file: ProfileFile): string[] {
  const out: string[] = [];
  const byKey = new Map((file.profiles ?? []).map((p) => [`${p.kind}:${p.id}`, p]));
  for (const p of file.profiles ?? []) for (const r of p.related ?? []) {
    const inv = RELATIONS[r.relation]?.inverse ?? [];
    if (!inv.length) continue;
    const other = byKey.get(`${p.kind}:${r.id}`);
    if (other && !(other.related ?? []).some((x) => x.id === p.id && inv.includes(x.relation))) out.push(`${p.id} “${r.relation}” ${r.id}, but ${r.id} does not say ${inv.join(' / ')} back`);
  }
  return out;
}
