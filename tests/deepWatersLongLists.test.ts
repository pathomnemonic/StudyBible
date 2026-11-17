import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { LONG_LIST_PROMPTS } from '../src/data/deepWatersLongLists';
import { matchDeepAnswer } from '../src/lib/deepWaters';

const P = (id: string) => DEEP_WATERS.find((p) => p.id === `authored-${id}`)!;
const status = (id: string, g: string) => matchDeepAnswer(P(id), g).status;

// What a reasonable player would type, and what must not be accepted. This is the check that finds a key that does not match its prompt.
const ACCEPT: Record<string, string[]> = {
  'latin-worship': ['kyrie', 'agnus dei', 'pater noster', 'ave maria', 'dominus vobiscum', 'gloria', 'ite missa est', 'sanctus', 'habemus papam', 'ex cathedra', 'credo', 'salve regina'],
  heresies: ['arianism', 'gnosticism', 'pelagianism', 'nestorianism', 'donatism', 'docetism', 'modernism', 'jansenism', 'manichaeism', 'albigensian heresy', 'montanism', 'monophysitism'],
  'catholic-classics': ['confessions', 'city of god', 'summa theologiae', 'imitation of christ', 'story of a soul', 'interior castle', 'divine comedy', 'spiritual exercises', 'rule of saint benedict', 'pensees', 'dark night of the soul'],
  'calendar-saints': ['francis of assisi', 'thomas aquinas', 'padre pio', 'mother teresa', 'saint augustine', 'joseph', 'michael', 'luke', 'lucy', 'john paul ii', 'patrick', 'thomas more'],
  shrines: ['lourdes', 'fatima', 'guadalupe', 'santiago de compostela', 'holy sepulchre', 'assisi', 'knock', "saint peter's basilica", 'walsingham', 'czestochowa', 'bethlehem'],
  'biblical-peoples': ['philistines', 'egyptians', 'babylonians', 'amalekites', 'samaritans', 'romans', 'moabites', 'hittites', 'canaanites', 'galatians', 'assyrians', 'edomites'],
  'foreign-rulers': ['pharaoh', 'nebuchadnezzar', 'cyrus', 'herod', 'pontius pilate', 'caesar augustus', 'queen of sheba', 'darius', 'xerxes', 'belshazzar', 'ahasuerus', 'alexander the great'],
  'theology-terms': ['trinity', 'incarnation', 'transubstantiation', 'original sin', 'grace', 'purgatory', 'magisterium', 'infallibility', 'natural law', 'indulgence', 'consubstantial', 'real presence'],
  'life-of-jesus': ['nativity', 'baptism of jesus', 'wedding at cana', 'transfiguration', 'last supper', 'crucifixion', 'ascension', 'sermon on the mount', 'raising of lazarus', 'flight into egypt', 'epiphany'],
  foods: ['bread', 'wine', 'honey', 'fish', 'figs', 'manna', 'olive oil', 'lamb', 'grapes', 'quail', 'unleavened bread', 'locusts'],
  occupations: ['shepherd', 'fisherman', 'carpenter', 'tax collector', 'farmer', 'soldier', 'potter', 'tentmaker', 'physician', 'priest', 'centurion'],
  'papal-names': ['john', 'pius', 'gregory', 'leo', 'benedict', 'francis', 'paul', 'clement', 'innocent', 'urban', 'hadrian', 'john paul'],
  'titles-of-jesus': ['messiah', 'son of god', 'lamb of god', 'good shepherd', 'prince of peace', 'king of kings', 'emmanuel', 'savior', 'rabbi', 'alpha and omega', 'the christ'],
  'christian-symbols': ['cross', 'dove', 'fish', 'lamb', 'anchor', 'chi-rho', 'halo', 'keys', 'lily', 'chalice', 'ichthys'],
};
const REJECT: Record<string, string[]> = {
  'latin-worship': ['lord have mercy', 'carpe diem', 'e pluribus unum'],
  heresies: ['lutheranism', 'buddhism', 'atheism'],
  'catholic-classics': ['mere christianity', 'paradise lost', 'the bible'],
  'calendar-saints': ['valentine', 'christopher'],
  shrines: ['mecca', 'stonehenge'],
  'biblical-peoples': ['vikings', 'mongols'],
  'foreign-rulers': ['david', 'solomon', 'saul'],
  'theology-terms': ['karma', 'nirvana'],
  'life-of-jesus': ['pentecost', 'conversion of paul'],
  foods: ['rice', 'potatoes', 'tomatoes', 'coffee'],
  occupations: ['astronaut', 'programmer'],
  'papal-names': ['john paul iii', 'peter ii'],
  'titles-of-jesus': ['allah', 'buddha'],
  'christian-symbols': ['pentagram', 'swastika'],
};

describe('the long open lists of the second hand-written batch', () => {
  it('are 14 open questions in the bank, each long enough to have a tail', () => {
    expect(LONG_LIST_PROMPTS).toHaveLength(14);
    for (const p of LONG_LIST_PROMPTS) {
      expect(DEEP_WATERS, p.id).toContain(p);
      expect(p.closed, p.id).toBeUndefined();
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(60);
      expect(p.basis?.length ?? 0, p.id).toBeGreaterThan(15);
      expect(p.prompt.split(/\s+/).length, p.id).toBeLessThanOrEqual(20);
      expect(`${p.prompt} ${p.context}`, p.id).not.toMatch(/\b(above|below)\b/i);
      const tiers = new Set(p.answers.map((a) => a.tier));
      expect(tiers.has(1), p.id).toBe(true);
      expect(tiers.size, p.id).toBeGreaterThanOrEqual(5);
    }
  });
  it('have no duplicate answers and no alias that belongs to another answer', () => {
    for (const p of LONG_LIST_PROMPTS) {
      const seen = new Map<string, string>();
      for (const a of p.answers) for (const s of [a.answer, ...(a.aliases ?? [])]) {
        const k = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        expect(seen.get(k) ?? a.answer, `${p.id}: "${s}"`).toBe(a.answer);
        seen.set(k, a.answer);
      }
    }
  });
  for (const [id, guesses] of Object.entries(ACCEPT)) {
    it(`${id}: accepts what a player would try and rejects what is out of scope`, () => {
      for (const g of guesses) expect(status(id, g), `${id}: "${g}"`).toBe('match');
      for (const g of REJECT[id] ?? []) expect(status(id, g), `${id}: "${g}"`).not.toBe('match');
    });
  }
});
