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
  const ids = new Set(f.profiles.map((p) => p?.id));
  for (const p of f.profiles) for (const r of p?.related ?? []) if (!ids.has(r.id)) errs.push(`profile “${p.id}”: related profile “${r.id}” is not in the file`);
  return errs;
}

/** profiles whose name or any alternate name contains what was typed (ignoring case and accents) */
export function findProfiles(list: Profile[], query: string, kind?: ProfileKind): Profile[] {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const q = n(query);
  if (!q) return [];
  return list.filter((p) => (!kind || p.kind === kind) && [p.name, ...(p.alternateNames ?? [])].some((x) => n(x).includes(q)));
}
