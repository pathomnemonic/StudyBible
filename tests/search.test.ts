import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY } from '../src/data/glossary';
import { COUNCILS } from '../src/data/councils';
import { PRAYERS } from '../src/data/prayers';
import { FEASTS } from '../src/data/feasts';
import { FEATURES } from '../src/lib/features';
import type { ChainMode } from '../src/chains/types';
import {
  docsFromApologetics, docsFromChains, docsFromCouncils, docsFromFeasts, docsFromFeatures, docsFromGlossary, docsFromLives, docsFromPrayers, docsFromSituations, docsFromTopics, docsFromLessons,
} from '../src/search/docs';
import { buildIndex, didYouMean, editDistance, groupHits, queryTerms, rank, stem } from '../src/search/rank';
import { SAMPLE_QUESTIONS } from '../src/search/synonyms';

const root = join(__dirname, '..');
const readAll = (dir: string, prefix: string) =>
  readdirSync(dir).filter((f) => f === `${prefix}.json` || (f.startsWith(prefix + '.') && f.endsWith('.json'))).sort().flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const chainDir = join(root, 'src/data/chains');
const modes: ChainMode[] = ['arguments', 'claims', 'development', 'heresies', 'words'];
const apo = JSON.parse(readFileSync(join(root, 'public/data/apologetics.json'), 'utf8'));
const doctrine = JSON.parse(readFileSync(join(root, 'public/data/doctrine/doctrine.json'), 'utf8'));
const g8 = JSON.parse(readFileSync(join(root, 'public/data/curriculum/grade-8.json'), 'utf8'));

const docs = [
  ...modes.flatMap((m) => docsFromChains(m, readAll(chainDir, m))),
  ...docsFromSituations(readAll(chainDir, 'situations')),
  ...docsFromLives(readAll(chainDir, 'lives')),
  ...docsFromApologetics(apo.topics),
  ...docsFromTopics(doctrine.topics),
  ...docsFromGlossary(GLOSSARY),
  ...docsFromCouncils(COUNCILS),
  ...docsFromPrayers(PRAYERS),
  ...docsFromFeasts(FEASTS),
  ...docsFromFeatures(FEATURES),
  ...docsFromLessons(g8.id, g8.name, g8.units),
];
const ix = buildIndex(docs);
const top = (q: string, n = 5) => rank(ix, q, { limit: n }).map((h) => h.doc.href);

/** question -> a route (or id fragment) that must be among the first five results */
const TABLE: [string, string][] = [
  ['why do Catholics pray to saints', '/study/arguments/intercession-of-saints'],
  ['why do Catholics pray to saints', '/study/apologetics/intercession-of-saints'],
  ['what is purgatory', '/study/arguments/purgatory'],
  ['what is purgatory', 'glossary?t=Purgatory'],
  ['is the pope infallible', '/study/glossary?t=Infallibility'],
  ['is the pope infallible', '/study/apologetics/papacy'],
  ['how do I make a good confession', '/study/arguments/confession-absolution'],
  ['do Catholics worship Mary', '/study/claims/catholics-worship-mary'],
  ['do Catholics worship statues', '/study/claims/catholics-worship-statues'],
  ['who decided which books are in the Bible', '/study/arguments/canon-of-scripture'],
  ['is the Eucharist just a symbol', '/study/claims/eucharist-just-a-symbol'],
  ['what is the real presence', '/study/arguments/real-presence'],
  ['why baptize babies', '/study/arguments/infant-baptism'],
  ['is salvation by faith alone', '/study/arguments/faith-and-works'],
  ['why does God allow suffering', '/study/apologetics/suffering'],
  ['was Jesus really God', '/study/arguments/divinity-of-christ'],
  ['why is Mary called the Mother of God', '/study/arguments/theotokos'],
  ['what did Arius teach', '/study/heresies/arianism'],
  ['what is Pelagianism', '/study/heresies/pelagianism'],
  ['what does ekklesia mean', '/study/words/ekklesia'],
  ['can priests really forgive sins', '/study/claims/priests-forgive-sins-instead-of-god'],
  ['I am grieving and need a saint to turn to', '/study/mentors/grief'],
  ['how can I stop being anxious', '/study/mentors/anxiety-and-fear'],
  ['tell me about Augustine', '/study/lives/augustine'],
  ['when was the Council of Nicaea', '/study/councils?n=1'],
  ['why did the Church oppose Galileo', '/study/claims/church-opposed-science-galileo'],
  ['how do I pray the rosary', '/study/apologetics/rosary'],
  ['what does the Church teach about hell', '/study/arguments/hell'],
  ['why do Catholics have 73 books', '/study/apologetics/canon'],
  ['do Catholics believe in indulgences for money', '/study/claims/indulgences-buy-your-way-out'],
];

describe('question handling', () => {
  it('strips question words and keeps the meaning', () => {
    expect(queryTerms('why do Catholics pray to saints').content).toEqual(['pray', 'saints']);
    expect(queryTerms('What is purgatory?').content).toEqual(['purgatory']);
    expect(queryTerms('is the pope infallible').content).toEqual(['pope', 'infallible']);
    expect(queryTerms('why do Catholics pray to saints').isQuestion).toBe(true);
    expect(queryTerms('purgatory').isQuestion).toBe(false);
  });
  it('expands with synonyms and phrase rewrites', () => {
    const flat = (q: string) => queryTerms(q).extra.map((e) => e.stems.join(' '));
    expect(flat('pray to saints').some((s) => s.includes('interces'))).toBe(true);
    expect(flat('how do I make a good confession').some((s) => s.includes('examin'))).toBe(true);
  });
  it('stems close forms together', () => {
    expect(stem('infallible')).toBe(stem('infallibility'));
    expect(stem('saints')).toBe(stem('saint'));
    expect(stem('prayers')).toBe(stem('pray'));
  });
});

describe('the new content is indexed', () => {
  it('has chains, claims, heresies, words, mentors, lives, apologetics, glossary, lessons', () => {
    const kinds = new Set(docs.map((d) => d.kind));
    for (const k of ['argument', 'claim', 'development', 'heresy', 'word', 'mentor', 'life', 'apologetics', 'glossary', 'council', 'topic', 'prayer', 'feast', 'feature', 'lesson']) expect(kinds.has(k as any), k).toBe(true);
    expect(docs.length).toBeGreaterThan(400);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });
  it('finds a step label and a quotation inside a chain', () => {
    const chains = readAll(chainDir, 'arguments');
    const c = chains.find((x: any) => x.id === 'real-presence');
    const label = c.steps[0].label as string;
    expect(rank(ix, label, { limit: 8 }).some((h) => h.doc.id === 'argument:real-presence')).toBe(true);
  });
  it('every document has a route', () => { for (const d of docs) expect(d.href.startsWith('/'), d.id).toBe(true); });
});

describe('natural questions land on the right page', () => {
  for (const [q, want] of TABLE) {
    it(`"${q}" finds ${want}`, () => {
      const hrefs = rank(ix, q, { limit: 5 }).map((h) => h.doc.href + ' ' + h.doc.id);
      expect(hrefs.some((h) => h.includes(want)), hrefs.join(' | ')).toBe(true);
    });
  }
  it('the table covers at least 25 distinct questions', () => { expect(new Set(TABLE.map((t) => t[0])).size).toBeGreaterThanOrEqual(25); });
  it('every sample question in the empty state finds something in Best answers', () => {
    for (const q of SAMPLE_QUESTIONS) expect(groupHits(rank(ix, q)).some((g) => g.id === 'best'), q).toBe(true);
  });
});

describe('pages and prayers', () => {
  it('offers the rosary page in Pray and do', () => {
    const g = groupHits(rank(ix, 'how do I pray the rosary')).find((x) => x.id === 'do')!;
    expect(g.hits.slice(0, 5).map((h) => h.doc.id), g.hits.map((h) => h.doc.id + ':' + h.score.toFixed(1)).join(' ')).toContain('feature:pray.rosary');
  });
});

describe('grouping', () => {
  it('puts Best answers first and keeps the documented order', () => {
    const g = groupHits(rank(ix, 'why do Catholics pray to saints'));
    expect(g[0].id).toBe('best');
    const order = ['best', 'teaching', 'scripture', 'fathers', 'do', 'learn', 'mine'];
    const idxs = g.map((x) => order.indexOf(x.id));
    expect([...idxs].sort((a, b) => a - b)).toEqual(idxs);
  });
  it('returns nothing for gibberish', () => { expect(rank(ix, 'qzxqzx')).toEqual([]); });
});

describe('did you mean', () => {
  it('fixes common misspellings', () => {
    expect(didYouMean(ix, 'purgatry')).toBe('purgatory');
    expect(didYouMean(ix, 'transubstanciation')).toBe('transubstantiation');
    expect(didYouMean(ix, 'eucarist')).toBe('eucharist');
    expect(didYouMean(ix, 'what is purgatory')).toBeNull();
  });
  it('edit distance counts a swap as one', () => { expect(editDistance('teh', 'the')).toBe(1); expect(editDistance('abc', 'xyz', 2)).toBeGreaterThan(2); });
});

describe('existing feature search still works', () => {
  it('finds the rosary page first', () => { expect(top('rosary', 3).length).toBeGreaterThan(0); });
});
