import MiniSearch from 'minisearch';
import { cccAll, cccRange } from '../data/ccc';
import { getDoctrine, type DoctrineTopic } from '../data/content';
import { lookupTerm, type GlossaryEntry } from '../data/glossary';
import { fold } from '../search/engine';

const STOP = new Set('a about after again all am an and any are as at be because been before being between both but by can catholic catholics church could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your believe believes teach teaches say says mean means'.split(' '));
const stem = (w: string) => (w.length > 5 ? w.replace(/(ing|ed|es|s)$/, '') : w.length > 3 ? w.replace(/s$/, '') : w);
const SIMILAR: Record<string, string[]> = { confess: ['penance', 'reconciliation', 'absolution'], confession: ['penance', 'reconciliation'], worship: ['adore', 'veneration'], baptize: ['baptism', 'infant'], mass: ['eucharist', 'sacrifice', 'liturgy'], pray: ['prayer'], saint: ['intercession', 'communion'], mary: ['virgin', 'mother'], suffer: ['suffering', 'evil'], pope: ['peter', 'successor'] };
export const questionTerms = (q: string) => [...new Set(fold(q).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem))];

let index: Promise<MiniSearch<{ id: number; t: string }>> | null = null;
const getIndex = () => (index ??= cccAll().then((all) => {
  const ms = new MiniSearch<{ id: number; t: string }>({ fields: ['t'], storeFields: ['t'], processTerm: (t) => { const f = fold(t); return STOP.has(f) ? null : stem(f); }, searchOptions: { prefix: (t: string) => t.length >= 6, fuzzy: false, combineWith: 'OR' } });
  ms.addAll(all.map((p) => ({ id: p.n, t: p.t })));
  return ms;
}));

export interface Answer { terms: string[]; glossary?: GlossaryEntry; paras: { n: number; text: string; matched: number }[]; topics: { id: string; title: string; summary: string }[] }

/** The Catechism's own words for a plain question: the paragraphs that match it best, the doctrine topics it touches, and a definition if it names a term. */
export async function askCatechism(question: string): Promise<Answer> {
  const terms = questionTerms(question);
  const words = fold(question).split(/[^a-z0-9]+/).filter(Boolean);
  let glossary: GlossaryEntry | undefined;
  for (let n = 3; n >= 1 && !glossary; n--) for (let i = 0; i + n <= words.length && !glossary; i++) glossary = lookupTerm(words.slice(i, i + n).join(' '));
  if (!terms.length) return { terms, glossary, paras: [], topics: [] };
  const ms = await getIndex();
  const hits = ms.search([...terms, ...terms.flatMap((t) => SIMILAR[t] ?? [])].join(' '));
  let need = terms.length >= 2 ? Math.max(2, Math.ceil(terms.length * 0.6)) : 1;
  while (need > 1 && !hits.some((h) => h.terms.length >= need)) need--;
  const paras = hits.filter((h) => h.terms.length >= need).slice(0, 8).map((h) => ({ n: h.id as number, text: String(h.t), matched: h.terms.length }));
  if (glossary) {
    // the paragraph that treats the named term comes first
    const first = (await cccRange(glossary.ccc, glossary.ccc))[0];
    if (first) paras.splice(0, paras.length, { n: first.n, text: first.t, matched: 99 }, ...paras.filter((p) => p.n !== first.n).slice(0, 7));
  }
  const d = await getDoctrine().catch(() => null);
  const topics = ((d?.topics ?? []) as DoctrineTopic[])
    .map((t) => ({ t, score: terms.filter((w) => fold(`${t.title} ${t.keywords.join(' ')}`).split(/[^a-z0-9]+/).map(stem).includes(w)).length }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 4)
    .map(({ t }) => ({ id: t.id, title: t.title, summary: t.summary }));
  return { terms, glossary, paras, topics };
}
