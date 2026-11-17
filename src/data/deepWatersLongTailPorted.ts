import type { DeepPrompt } from './deepWaters';
import { LONG_TAIL_PROMPTS } from './deepWatersLongTail';

/**
 * The part of ChatGPT's long-tail batch (src/data/deepWatersLongTail.ts) that was checked here and kept, with corrections. Not kept: lists that duplicate
 * an existing question (Latin in worship, heresies, shrines, symbols, universities, parts of the Mass), lists that fell under 60 answers once errors were removed (saints born in Italy, patrons of illnesses, patrons of countries), lists whose answers a player could not reasonably
 * give or that were padded (Korean and Japanese martyrs by transliterated name, relics, pilgrimage routes, minor basilicas, city patrons), and the popes list
 * (its title said "not canonized or venerated as a saint" but it held Blessed popes and saints). Corrections below are listed per question.
 */
const DROP: Record<string, string[]> = {
  'longtail-augustine-works': ['The Enchiridion on Faith, Hope and Love', 'The Literal Meaning of Genesis', 'On the Psalms'],
  'longtail-aquinas-works': ['On the Sorts', 'De Rationibus Fidei', 'De Unitate Intellectus contra Averroistas', 'De Veritate', 'Contra Impugnantes Dei Cultum', 'On the Perfection of the Christian Life'],
  'longtail-fathers-works': ['On the Apostolic Preaching', 'The Seven Epistles of Ignatius', 'Epistle to the Philippians'],
  'longtail-late-medieval-theologians': ['Erigena', 'Michael Psellos', 'Theophylact of Bulgaria', 'Nicholas of Methone', 'Hugh of Amiens'],
  'longtail-francis-canonizations': ['Álvaro del Portillo', 'Guadalupe Ortiz de Landázuri', 'Giuseppina Vannini', 'Maria Alfonsina Danil Ghattas', 'María de la Purísima'],
  'longtail-patron-professions': ['Cloud', 'Eraclius', 'Joseph Calasanz'],
  'longtail-english-martyrs': [],
  'longtail-martyrdom-texts': ['Acts of Thomas the Apostle', 'Acts of Paul and Thecla'],
  'longtail-ancient-sees': ['Philadelphia in Lydia', 'Antioch Pisidia', 'Pella', 'Heraclea', 'Byzantium'],
};
// the most famous sees were missing from the original key
const ADD: Record<string, { answer: string; tier: 1 | 2 | 3; aliases?: string[] }[]> = {
  'longtail-ancient-sees': [
    { answer: 'Rome', tier: 1 }, { answer: 'Jerusalem', tier: 1 }, { answer: 'Antioch', tier: 1, aliases: ['Antioch in Syria'] }, { answer: 'Ephesus', tier: 1 }, { answer: 'Corinth', tier: 2 },
    { answer: 'Smyrna', tier: 2 }, { answer: 'Thessalonica', tier: 2 }, { answer: 'Hippo', tier: 2, aliases: ['Hippo Regius'] }, { answer: 'Philippi', tier: 3 }, { answer: 'Laodicea', tier: 3 }, { answer: 'Pergamum', tier: 3 }, { answer: 'Sardis', tier: 3 }, { answer: 'Colossae', tier: 3 },
  ],
};
const KEEP = Object.keys(DROP);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const LONG_TAIL_PORTED: DeepPrompt[] = LONG_TAIL_PROMPTS.filter((p) => KEEP.includes(p.id)).map((p) => {
  const drop = new Set(DROP[p.id].map(norm));
  const answers = p.answers.filter((a) => !drop.has(norm(a.answer)));
  const have = new Set(answers.map((a) => norm(a.answer)));
  for (const a of ADD[p.id] ?? []) if (!have.has(norm(a.answer))) answers.push(a);
  const { commonGuesses: _g, reviewFlags: _r, ...rest } = p as DeepPrompt & { commonGuesses?: unknown; reviewFlags?: unknown };
  void _g; void _r;
  return { ...rest, id: `ported-${p.id.replace('longtail-', '')}`, answers } as DeepPrompt;
});
