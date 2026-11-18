import type { DeepAnswer, DeepPrompt } from './deepWaters';

/** Saints invoked for a need: drafted by ChatGPT (branch `feature/deep-waters-krillion-bank`), imported and checked by machine, not yet reviewed by a person. It is asked daily because nearly everyone can name a patron saint. */
const rows = (t: string): DeepAnswer[] => t.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [answer, tier, al] = l.split('|');
  const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { answer: answer.trim(), tier: Number(tier) as DeepAnswer['tier'], ...(aliases.length ? { aliases } : {}) };
});
export const PATRON_SAINTS: DeepPrompt = {
  id: 'gpt-saint-patronages', theme: 'saints', ignore: ['saint'],
  prompt: "Name a saint traditionally invoked for a particular need.", context: "Includes widely established patronages and traditional devotions; local customs may differ.",
  basis: "Catholic Encyclopedia (1913, public domain); Butler's Lives of the Saints; Catholic devotional reference works. [Drafted by ChatGPT on a side branch; imported and checked by machine, not yet reviewed by a person.]",
  answers: rows(`
Saint Christopher|1|Christopher of Lycia
Saint Joseph|1|Joseph of Nazareth
Saint Luke|1|Luke the Evangelist
Saint Cecilia|1|Cecilia of Rome
Saint Blaise|2
Saint Anthony of Padua|2
Saint Jude|2
Saint Rita of Cascia|2
Saint Monica|2
Saint Dymphna|3
Saint Peregrine|3
Saint Florian|3
Saint Isidore the Farmer|3
Saint Francis of Assisi|3
Saint Hubert|3
Saint Nicholas|3
Saint Barbara|4
Saint Lawrence|4
Saint Apollonia|4
Saint Erasmus|4
Saint Roch|4
Saint Sebastian|4
Saint Anne|4
Saint Elizabeth of Hungary|4
Saint Thomas Aquinas|4
Saint Albert the Great|5
Saint Genesius|5
Saint Zita|5
Saint Homobonus|5
Saint Thomas More|5
Saint Catherine of Alexandria|5
Saint Margaret of Antioch|5
Saint Raymond Nonnatus|5
Saint John Vianney|5
Saint Gerard Majella|5
Saint Gianna Beretta Molla|6
Saint Camillus de Lellis|6
Saint John Bosco|6
`),
};
