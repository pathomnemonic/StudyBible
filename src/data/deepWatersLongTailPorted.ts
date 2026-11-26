import type { DeepPrompt } from './deepWaters';
import { LONG_TAIL_PROMPTS } from './deepWatersLongTail';

/**
 * The part of ChatGPT's long-tail batch (src/data/deepWatersLongTail.ts) that was checked here and kept, with corrections. Not kept: lists that duplicate
 * an existing question (Latin in worship, heresies, shrines, symbols, universities, parts of the Mass), lists whose answers a player could not reasonably
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
  'longtail-italian-saints': ['Joseph Calasanz', 'Urban V', 'Pope Eusebius', 'Pope Sixtus II', 'Pope Damasus I', 'Chiara della Croce da Montefalco', 'Francesca Romana', 'Giacomo Bianconi'],
  'longtail-patron-illnesses': ['Ovidius', 'Swithbert', 'Catherine of Sweden', 'Aidan of Lindisfarne', 'Aloysius of Gonzaga'],
  'longtail-patron-countries': ['Our Lady of Peace', 'Our Lady of the Assumption', 'Our Lady of Sorrows', 'Our Lady of the Cape', 'Our Lady of Help', 'Our Lady of Lanka', 'Teresia of Calcutta'],
  'longtail-martyrdom-texts': ['Acts of Thomas the Apostle', 'Acts of Paul and Thecla'],
  'longtail-ancient-sees': ['Philadelphia in Lydia', 'Antioch Pisidia', 'Pella', 'Heraclea', 'Byzantium'],
};
// the most famous sees were missing from the original key
type Add = { answer: string; tier: 1 | 2 | 3 | 4 | 5 | 6; aliases?: string[] };
const ADD: Record<string, Add[]> = {
  'longtail-italian-saints': [
    { answer: 'Anselm of Canterbury', tier: 4, aliases: ['Anselm of Aosta'] }, { answer: 'Bonaventure', tier: 3 }, { answer: 'Peter Damian', tier: 4 }, { answer: 'Pius X', tier: 3 }, { answer: 'Paul VI', tier: 3 },
    { answer: 'Anthony Zaccaria', tier: 5 }, { answer: 'Jerome Emiliani', tier: 5 }, { answer: 'Cajetan', tier: 4, aliases: ['Gaetano of Thiene'] }, { answer: 'Francis Caracciolo', tier: 5 }, { answer: 'Andrew Avellino', tier: 5 },
    { answer: 'Vincent Pallotti', tier: 5 }, { answer: 'Dominic Savio', tier: 3 }, { answer: 'Leonard Murialdo', tier: 6 }, { answer: 'John Baptist Scalabrini', tier: 5 }, { answer: 'Frances Xavier Cabrini', tier: 2, aliases: ['Mother Cabrini'] },
    { answer: 'Magdalene of Canossa', tier: 6 }, { answer: 'Romuald', tier: 5 }, { answer: 'Gregory the Great', tier: 2 }, { answer: 'Scholastica', tier: 3 }, { answer: 'Agatha', tier: 3 }, { answer: 'Lucy', tier: 2 },
    { answer: 'Cecilia', tier: 3 }, { answer: 'Mary Mazzarello', tier: 5 }, { answer: 'Joseph Cafasso', tier: 6 },
  ],
  'longtail-patron-illnesses': [
{ answer: 'Valentine', tier: 3 },
    { answer: 'Sebastian', tier: 3 },
    { answer: 'Hubert', tier: 4 },
    { answer: 'Cornelius', tier: 5 },
    { answer: 'Wolfgang', tier: 5 },
    { answer: 'Odilia', tier: 5 },
    { answer: 'Servatius', tier: 6 },
    { answer: 'Maurus', tier: 6 },
  ],
  'longtail-patron-countries': [
{ answer: 'Joan of Arc', tier: 2 },
    { answer: 'Thérèse of Lisieux', tier: 2 },
    { answer: 'Brigid of Kildare', tier: 2 },
    { answer: 'Boniface', tier: 3 },
    { answer: 'Wenceslaus', tier: 3 },
    { answer: 'Mark the Evangelist', tier: 3 },
    { answer: 'Columba', tier: 3 },
    { answer: 'Charles Lwanga', tier: 4 },
    { answer: 'Sava', tier: 5 },
    { answer: 'Gregory the Illuminator', tier: 5 },
    { answer: 'Nino', tier: 6 },
    { answer: 'Canute IV', tier: 6 },
  ],
  'longtail-ancient-sees': [
    { answer: 'Rome', tier: 1 }, { answer: 'Jerusalem', tier: 1 }, { answer: 'Antioch', tier: 1, aliases: ['Antioch in Syria'] }, { answer: 'Ephesus', tier: 1 }, { answer: 'Corinth', tier: 2 },
    { answer: 'Smyrna', tier: 2 }, { answer: 'Thessalonica', tier: 2 }, { answer: 'Hippo', tier: 2, aliases: ['Hippo Regius'] }, { answer: 'Philippi', tier: 3 }, { answer: 'Laodicea', tier: 3 }, { answer: 'Pergamum', tier: 3 }, { answer: 'Sardis', tier: 3 }, { answer: 'Colossae', tier: 3 },
  ],
};
// Basilion review (issue 26), Class B batch 14: two entries for one saint scored twice in one list are merged here,
// in the ported list, because the source bank enforces a 60 answer minimum that a source level merge would break
const MERGE: Record<string, { keep: string; drop: string }[]> = {
  'longtail-patron-illnesses': [{ keep: 'Anthony the Abbot', drop: 'Anthony of Egypt' }],
};
const KEEP = Object.keys(DROP);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const LONG_TAIL_PORTED: DeepPrompt[] = LONG_TAIL_PROMPTS.filter((p) => KEEP.includes(p.id)).map((p) => {
  const drop = new Set(DROP[p.id].map(norm));
  let answers = p.answers.filter((a) => !drop.has(norm(a.answer)));
  const have = new Set(answers.map((a) => norm(a.answer)));
  for (const a of ADD[p.id] ?? []) if (!have.has(norm(a.answer))) answers.push(a);
  for (const m of MERGE[p.id] ?? []) {
    const k = answers.find((a) => norm(a.answer) === norm(m.keep));
    const d = answers.find((a) => norm(a.answer) === norm(m.drop));
    if (k && d) {
      const aliases = [...(k.aliases ?? [])];
      for (const a of [d.answer, ...(d.aliases ?? [])]) if (!aliases.includes(a)) aliases.push(a);
      answers = answers.map((a) => (a === k ? { ...a, aliases } : a)).filter((a) => a !== d);
    }
  }
  if (p.id === 'longtail-ancient-sees') { // Beroea is the list's rarest answer; it belongs after the appended famous sees, not before them
    const bi = answers.findIndex((a) => norm(a.answer) === 'beroea');
    if (bi >= 0) answers.push(answers.splice(bi, 1)[0]);
  }
  const { commonGuesses: _g, reviewFlags: _r, ...rest } = p as DeepPrompt & { commonGuesses?: unknown; reviewFlags?: unknown };
  void _g; void _r;
  return { ...rest, id: `ported-${p.id.replace('longtail-', '')}`, answers } as DeepPrompt;
});
